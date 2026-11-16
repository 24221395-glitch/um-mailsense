"""extract_details(email) -> EmailDetails   (W2-AI-02, FR-15)"""

import re
from datetime import datetime, timedelta, timezone

from mailsense_ai.classifier import format_email
from mailsense_ai.contracts import EmailDetails, EmailInput
from mailsense_ai.llm_client import LLMClient, get_client
from mailsense_ai.prompts import load

PROMPT_VERSION = "extract_v1"
MYT = timezone(timedelta(hours=8))  # Malaysia time
_URL = re.compile(r"https?://[^\s<>\"')\]]+", re.IGNORECASE)
_NULLS = {"", "null", "none", "n/a", "na", "-", "unknown", "not stated", "not specified"}


def _text(value: object, limit: int) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return None if text.lower() in _NULLS else text[:limit]


def _date(value: object) -> datetime | None:
    text = _text(value, 40)
    if not text:
        return None
    try:
        dt = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        try:
            dt = datetime.strptime(text[:10], "%Y-%m-%d")
        except ValueError:
            return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=MYT)
    if not 2000 <= dt.year <= 2100:
        return None
    return dt


def _link(value: object, email_text: str) -> str | None:
    """Only accept a link that really appears in the email (no invented URLs)."""
    url = _text(value, 2000)
    if not url:
        return None
    url = url.rstrip(".,;")
    found = [u.rstrip(".,;") for u in _URL.findall(email_text)]
    if url in found:
        return url
    # model may drop a trailing slash or query; accept a unique close match
    close = [u for u in found if u.startswith(url) or url.startswith(u)]
    return close[0] if len(close) == 1 else None


def extract_details(email: EmailInput, client: LLMClient | None = None) -> EmailDetails:
    client = client or get_client()
    data = client.chat_json(load(PROMPT_VERSION), format_email(email), max_tokens=200)
    return EmailDetails(
        deadline=_date(data.get("deadline")),
        event_date=_date(data.get("event_date")),
        venue=_text(data.get("venue"), 300),
        organiser=_text(data.get("organiser"), 200),
        registration_link=_link(data.get("registration_link"), email.body_text or ""),
    )
