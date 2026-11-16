"""The only backend file that imports mailsense_ai (W3-AI-03).

process_pending() classifies and extracts details for emails that have not been processed yet.
Each email goes to the LLM once (FR-14). If the LLM is down or the daily budget is used up,
emails stay "Sorting…" and are retried on the next sync (NFR-24).
"""

import logging
import threading
from datetime import UTC, datetime

import mailsense_ai as ai
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import Email, User

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
