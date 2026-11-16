"""The only backend file that imports mailsense_ai (W3-AI-03).

process_pending() classifies and extracts details for emails that have not been processed yet.
Each email goes to the LLM once (FR-14). If the LLM is down or the daily budget is used up,
emails stay "Sorting…" and are retried on the next sync (NFR-24).
"""

import logging
import threading
from datetime import UTC, datetime

import mailsense_ai as ai
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import Ad, AdRecommendation, CVProfile, Email, User

log = logging.getLogger(__name__)

SEGMENTS = {s.value for s in ai.Segment}
_user_locks: dict[int, threading.Lock] = {}
_locks_guard = threading.Lock()
_configured = False


def configure() -> bool:
    """Set up the LLM client from settings. Returns False if no API key is set."""
    global _configured
    s = get_settings()
    if not s.llm_api_key:
        log.warning("LLM_API_KEY not set: emails will stay unsorted until it is configured")
        return False
    ai.configure(
        ai.LLMClient(
            api_key=s.llm_api_key,
            provider=s.llm_provider,
            model=s.llm_model or None,
            base_url=s.llm_base_url or None,
            daily_token_limit=s.llm_daily_token_limit,
        )
    )
    _configured = True
    return True


def usage() -> dict:
    """LLM usage today, for the admin dashboard."""
    if not _configured:
        return {"configured": False}
    u = ai.get_client().usage
    return {
        "configured": True,
        "model": ai.get_client().model,
        "day": u.day.isoformat(),
        "requests": u.requests,
        "prompt_tokens": u.prompt_tokens,
        "completion_tokens": u.completion_tokens,
    }


def _to_input(email: Email) -> ai.EmailInput:
    return ai.EmailInput(
        subject=email.subject,
        sender_name=email.sender_name,
        sender_email=email.sender_email,
        body_text=email.body_text or email.snippet,
        received_at=email.received_at,
    )


def process_email(email: Email) -> None:
    """Classify + extract one email in place. Raises ai.LLMError on failure."""
    data = _to_input(email)
    if not email.segment_is_manual:
        result = ai.classify_email(data)
        email.segment = result.segment.value
        email.segment_confidence = result.confidence
        email.segment_reason = result.reason
    # Extraction costs a second call; skip mail the student will not care about.
    if email.segment != ai.Segment.NOT_FOR_ME:
        details = ai.extract_details(data)
        email.deadline = details.deadline
        email.event_date = details.event_date
        email.venue = details.venue
        email.organiser = details.organiser
        email.registration_link = details.registration_link
    email.classified_at = datetime.now(UTC)


def _lock_for(user_id: int) -> threading.Lock:
    with _locks_guard:
        return _user_locks.setdefault(user_id, threading.Lock())


def process_pending(db: Session, user: User, limit: int = 200) -> int:
    """Process this user's unprocessed emails, newest first. Returns how many succeeded."""
    if not _configured and not configure():
        return 0
    lock = _lock_for(user.id)
    if not lock.acquire(blocking=False):
        return 0  # already running for this user (scheduler + manual refresh)
    done = 0
    try:
        pending = db.scalars(
            select(Email)
            .where(
                Email.user_id == user.id,
                Email.classified_at.is_(None),
                Email.ai_attempts < get_settings().ai_max_attempts,
            )
            .order_by(Email.received_at.desc())
            .limit(limit)
        ).all()
        for email in pending:
            try:
                process_email(email)
                done += 1
            except ai.BudgetExceeded:
                log.warning("LLM daily budget reached; remaining emails wait until tomorrow")
                db.rollback()
                break
            except ai.LLMError as exc:
                db.rollback()
                if "API key" in str(exc) or "unreachable" in str(exc):
                    log.error("LLM unavailable, will retry next sync: %s", exc)
                    break  # not this email's fault; don't count an attempt
                email.ai_attempts += 1
                log.warning(
                    "AI failed for email %s (attempt %s): %s", email.id, email.ai_attempts, exc
                )
            db.commit()
    finally:
        lock.release()
    return done


# --- CV profile and recommendations (W3-AI-03) --------------------------------------------

RECOMMEND_LIMIT = 150  # newest emails scored per run; older mail is not worth the cost


def parse_cv(data: bytes) -> ai.CVProfile:
    """Raises ai.CVParseError (bad file) or ai.LLMError (AI unavailable)."""
    if not _configured and not configure():
        raise ai.LLMError("AI is not set up yet (LLM_API_KEY missing)")
    return ai.parse_cv(data)


def _profile_for(db: Session, user: User) -> ai.CVProfile | None:
    row = db.scalar(select(CVProfile).where(CVProfile.user_id == user.id))
    if row is None or not (row.field_of_study or row.skills or row.interests):
        return None
    return ai.CVProfile(
        field_of_study=row.field_of_study,
        year_of_study=row.year_of_study,
        skills=row.skills or [],
        interests=row.interests or [],
        summary=row.summary or "",
    )


def _email_item(email: Email) -> ai.RecommendItem:
    text = f"From: {email.sender_name}\n{email.snippet or (email.body_text or '')[:500]}"
    return ai.RecommendItem(
        id=str(email.id),
        kind="email",
        title=email.subject,
        text=text,
        segment=email.segment if email.segment in SEGMENTS else None,
    )


def reset_recommendations(db: Session, user: User) -> None:
    """Profile changed: every email must be scored again."""
    db.execute(
        update(Email)
        .where(Email.user_id == user.id)
        .values(recommendation=None, recommendation_score=None, recommendation_reason=None)
    )
    db.execute(delete(AdRecommendation).where(AdRecommendation.user_id == user.id))
    db.commit()


def recommend_pending(db: Session, user: User) -> int:
    """Label sorted emails "for you" / "not for you" against the user's profile (FR-23/24/25)."""
    profile = _profile_for(db, user)
    if profile is None:
        return 0
    if not _configured:
        configure()  # without an LLM the recommender falls back to keyword matching
    lock = _lock_for(-user.id)  # separate from the classification lock
    if not lock.acquire(blocking=False):
        return 0
    try:
        emails = db.scalars(
            select(Email)
            .where(
                Email.user_id == user.id,
                Email.classified_at.is_not(None),
                Email.recommendation.is_(None),
            )
            .order_by(Email.received_at.desc())
            .limit(RECOMMEND_LIMIT)
        ).all()
        if not emails:
            return 0
        try:
            recs = ai.recommend(profile, [_email_item(e) for e in emails])
        except ai.BudgetExceeded:
            log.warning("LLM daily budget reached; recommendations wait until tomorrow")
            return 0
        for email, rec in zip(emails, recs, strict=True):
            email.recommendation = rec.label
            email.recommendation_score = rec.score
            email.recommendation_reason = rec.reason
        db.commit()
        return len(emails)
    finally:
        lock.release()


def _ad_item(ad: Ad) -> ai.RecommendItem:
    parts = [f"Posted by: {ad.organisation.name}", ad.description[:500]]
    if ad.faculty:
        parts.append(f"For: {ad.faculty}")
    return ai.RecommendItem(
        id=f"ad:{ad.id}",
        kind="ad",
        title=ad.title,
        text="\n".join(parts),
        segment=ad.category if ad.category in SEGMENTS else None,
        target_fields=ad.target_fields or [],
    )


def recommend_ads(db: Session, user: User, ad_ids: list[int]) -> int:
    """Score board posts this student has no score for yet. Returns how many were scored."""
    profile = _profile_for(db, user)
    if profile is None or not ad_ids:
        return 0
    if not _configured:
        configure()
    lock = _lock_for(-(10**9) - user.id)
    if not lock.acquire(blocking=False):
        return 0
    try:
        scored = set(
            db.scalars(
                select(AdRecommendation.ad_id).where(
                    AdRecommendation.user_id == user.id, AdRecommendation.ad_id.in_(ad_ids)
                )
            )
        )
        ads = db.scalars(select(Ad).where(Ad.id.in_([i for i in ad_ids if i not in scored]))).all()
        if not ads:
            return 0
        try:
            recs = ai.recommend(profile, [_ad_item(a) for a in ads])
        except ai.BudgetExceeded:
            return 0
        for ad, rec in zip(ads, recs, strict=True):
            db.add(
                AdRecommendation(
                    user_id=user.id,
                    ad_id=ad.id,
                    label=rec.label,
                    score=rec.score,
                    reason=rec.reason,
                )
            )
        db.commit()
        return len(ads)
    finally:
        lock.release()


def forget_ad_scores(db: Session, ad_id: int) -> None:
    """A post was edited: everyone's score for it must be recomputed."""
    db.execute(delete(AdRecommendation).where(AdRecommendation.ad_id == ad_id))
