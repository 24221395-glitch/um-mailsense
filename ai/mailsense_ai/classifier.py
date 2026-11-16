"""classify_email(email) -> Classification   (W2-AI-01, FR-13)"""

import os
import re

from mailsense_ai.contracts import Classification, EmailInput, Segment
from mailsense_ai.llm_client import LLMClient, LLMError, get_client
from mailsense_ai.prompts import load

PROMPT_VERSION = os.environ.get("MAILSENSE_CLASSIFY_PROMPT", "classify_v1")
MAX_BODY_CHARS = 2500  # keeps cost down; the top of an email carries its purpose

# UM staff/offices send from these domains (students use siswa*.um.edu.my, so those are
# excluded). Used as a safety net so official notices are not hidden.
_UM_DOMAIN = re.compile(r"@(?!siswa)([a-z0-9-]+\.)*um\.edu\.my$", re.IGNORECASE)


def format_email(email: EmailInput, max_chars: int = MAX_BODY_CHARS) -> str:
    body = re.sub(r"\n{3,}", "\n\n", email.body_text or "").strip()
    if len(body) > max_chars:
        body = body[:max_chars] + "\n[...trimmed]"
    received = email.received_at.isoformat() if email.received_at else "unknown"
    return (
        f"From: {email.sender_name} <{email.sender_email}>\n"
        f"Received: {received}\n"
        f"Subject: {email.subject}\n\n"
        f"<email_body>\n{body}\n</email_body>"
    )


def _to_segment(value: object) -> Segment:
    code = str(value or "").strip().upper().replace(" ", "_").replace("&", "")
    try:
        return Segment(code)
    except ValueError as exc:
        raise LLMError(f"LLM returned unknown segment {value!r}") from exc


def classify_email(email: EmailInput, client: LLMClient | None = None) -> Classification:
    client = client or get_client()
    data = client.chat_json(load(PROMPT_VERSION), format_email(email), max_tokens=120)
    segment = _to_segment(data.get("segment"))
    try:
        confidence = min(max(float(data.get("confidence", 0.5)), 0.0), 1.0)
    except (TypeError, ValueError):
        confidence = 0.5
    reason = str(data.get("reason") or "")[:200]

    # Safety net for NFR-18 (UM notices recalled >= 95%): an email from a UM address that the
    # model is unsure about is not hidden in "Not for me".
    if (
        segment is Segment.NOT_FOR_ME
        and confidence < 0.8
        and _UM_DOMAIN.search(email.sender_email or "")
    ):
        segment, reason = Segment.UM_NOTICE, f"From a UM address (model unsure: {reason})"

    return Classification(segment=segment, confidence=confidence, reason=reason)
