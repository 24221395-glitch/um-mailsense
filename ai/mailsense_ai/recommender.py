"""recommend(profile, items) -> list[Recommendation]   (W3-AI-02, FR-23/24/25)

- UM_NOTICE items are always "for you" (official notices matter to every student).
- SECURITY items are always "for you" (they concern the student's own accounts).
- NOT_FOR_ME items are always "not for you".
- Everything else is scored by the LLM in batches (cheap: ~1 call per 15 items).
- If the LLM fails, a keyword match against skills/interests/field is used instead.
"""

import json
import logging
import re

from mailsense_ai.contracts import CVProfile, Recommendation, RecommendItem, Segment
from mailsense_ai.llm_client import BudgetExceeded, LLMClient, LLMError, get_client
from mailsense_ai.prompts import load

log = logging.getLogger(__name__)

PROMPT_VERSION = "recommend_v1"
BATCH_SIZE = 15
ITEM_CHARS = 500
FOR_YOU_THRESHOLD = 0.6


def _label(score: float) -> str:
    return "for_you" if score >= FOR_YOU_THRESHOLD else "not_for_you"


def _rec(item_id: str, score: float, reason: str) -> Recommendation:
    score = round(min(max(score, 0.0), 1.0), 3)
    return Recommendation(item_id=item_id, score=score, label=_label(score), reason=reason[:120])


def profile_text(profile: CVProfile) -> str:
    parts = [
        f"Field of study: {profile.field_of_study or 'unknown'}",
        f"Year of study: {profile.year_of_study or 'unknown'}",
        f"Skills: {', '.join(profile.skills) or 'none listed'}",
        f"Interests: {', '.join(profile.interests) or 'none listed'}",
    ]
    if profile.summary:
        parts.append(f"Summary: {profile.summary}")
    return "\n".join(parts)


def keyword_score(profile: CVProfile, item: RecommendItem) -> Recommendation:
    """Fallback without the LLM: look for the student's skills/interests/field in the item."""
    haystack = f"{item.title} {item.text} {' '.join(item.target_fields)}".lower()
    matches = []
    for kind, terms in (
        ("skill", profile.skills),
        ("interest", profile.interests),
        ("field", [profile.field_of_study] if profile.field_of_study else []),
    ):
        for term in terms:
            if term and re.search(rf"(?<!\w){re.escape(term.lower())}(?!\w)", haystack):
                matches.append((kind, term))
    if not matches:
        return _rec(item.id, 0.3, "No clear match with your profile")
    kind, term = matches[0]
    return _rec(item.id, 0.5 + 0.15 * len(matches), f"Matches your {kind}: {term}")


def _llm_batch(
    profile: CVProfile, batch: list[RecommendItem], client: LLMClient
) -> dict[str, Recommendation]:
    items = [
        {
            "id": it.id,
            "type": it.kind,
            "segment": it.segment.value if it.segment else None,
            "title": it.title[:200],
            "text": it.text[:ITEM_CHARS],
            **({"target_fields": it.target_fields} if it.target_fields else {}),
        }
        for it in batch
    ]
    user = (
        f"<profile>\n{profile_text(profile)}\n</profile>\n\n"
        f"<items>\n{json.dumps(items, ensure_ascii=False)}\n</items>"
    )
    data = client.chat_json(load(PROMPT_VERSION), user, max_tokens=60 * len(batch) + 50)
    wanted = {it.id for it in batch}
    out: dict[str, Recommendation] = {}
    for row in data.get("results") or []:
        if not isinstance(row, dict) or row.get("id") not in wanted:
            continue
        try:
            score = float(row.get("score"))
        except (TypeError, ValueError):
            continue
        out[row["id"]] = _rec(row["id"], score, str(row.get("reason") or ""))
    return out


def recommend(
    profile: CVProfile, items: list[RecommendItem], client: LLMClient | None = None
) -> list[Recommendation]:
    """Score every item against the profile. Returns one Recommendation per item, same order."""
    results: dict[str, Recommendation] = {}
    to_score: list[RecommendItem] = []
    for item in items:
        if item.segment is Segment.UM_NOTICE:
            results[item.id] = _rec(item.id, 0.9, "Official UM notice")
        elif item.segment is Segment.SECURITY:
            results[item.id] = _rec(item.id, 0.85, "About your account security")
        elif item.segment is Segment.NOT_FOR_ME:
            results[item.id] = _rec(item.id, 0.05, "Not relevant")
        else:
            to_score.append(item)

    if to_score:
        try:
            client = client or get_client()
        except LLMError:
            client = None
        for start in range(0, len(to_score), BATCH_SIZE):
            batch = to_score[start : start + BATCH_SIZE]
            scored: dict[str, Recommendation] = {}
            if client is not None:
                try:
                    scored = _llm_batch(profile, batch, client)
                except BudgetExceeded:
                    raise  # stop spending; caller retries tomorrow
                except LLMError as exc:
                    log.warning("Recommender LLM failed, using keyword fallback: %s", exc)
            for item in batch:
                results[item.id] = scored.get(item.id) or keyword_score(profile, item)

    return [results[item.id] for item in items]
