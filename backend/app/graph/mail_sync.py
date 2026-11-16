"""Pulls new inbox mail for a user from every connected mailbox and stores it.

Runs every SYNC_INTERVAL_MINUTES in the background (see app.main) and on demand via
POST /api/v1/emails/sync. Each email is stored once (unique per account + provider id).
"""

import asyncio
import logging
import time
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import google_auth, msal_auth
from app.core.config import get_settings
from app.core.database import SessionLocal
from app.graph import gmail_client, graph_client
from app.graph.base import MailAuthError
from app.models import Email, OAuthAccount, User

log = logging.getLogger(__name__)

FIRST_SYNC_DAYS = 30
_FETCHERS = {"microsoft": graph_client.fetch_inbox, "google": gmail_client.fetch_inbox}
_REFRESHERS = {"microsoft": msal_auth.refresh, "google": google_auth.refresh}
_AUTH_ERRORS = (msal_auth.MicrosoftAuthError, google_auth.GoogleAuthError, MailAuthError)


def as_utc(dt: datetime) -> datetime:
    """SQLite drops time zones; everything we store is UTC."""
    return dt.replace(tzinfo=UTC) if dt.tzinfo is None else dt


def _access_token(db: Session, account: OAuthAccount) -> str:
    if as_utc(account.expires_at) > datetime.now(UTC) + timedelta(minutes=2):
        return account.access_token
    if not account.refresh_token:
        raise MailAuthError("No refresh token; user must sign in again")
    token, new_refresh, expires_at = _REFRESHERS[account.provider](account.refresh_token)
    account.access_token = token
    account.refresh_token = new_refresh or account.refresh_token
    account.expires_at = expires_at
    db.commit()
    return token


def sync_account(db: Session, account: OAuthAccount) -> int:
    """Fetch and store new mail for one mailbox. Returns how many emails were new."""
    if account.provider not in _FETCHERS:  # e.g. the local demo account
        return 0
    latest = db.scalar(select(func.max(Email.received_at)).where(Email.account_id == account.id))
    since = (
        as_utc(latest) - timedelta(minutes=5)
        if latest
        else datetime.now(UTC) - timedelta(days=FIRST_SYNC_DAYS)
    )
    try:
        token = _access_token(db, account)
        fetched = _FETCHERS[account.provider](token, since, get_settings().sync_max_messages)
    except _AUTH_ERRORS as exc:
        log.warning("Mailbox %s needs reconnecting: %s", account.id, exc)
        account.needs_reconnect = True
        db.commit()
        return 0

    existing = {
        row.provider_message_id: row
        for row in db.scalars(
            select(Email).where(
                Email.account_id == account.id,
                Email.provider_message_id.in_([f.provider_message_id for f in fetched]),
            )
        )
    }
    new = 0
    for f in fetched:
        if f.provider_message_id in existing:
            existing[f.provider_message_id].is_read = f.is_read
            continue
        db.add(Email(user_id=account.user_id, account_id=account.id, **f.__dict__))
        new += 1
    account.needs_reconnect = False
    try:
        db.commit()
    except IntegrityError:  # another request synced the same mail at the same moment
        db.rollback()
        return 0
    return new


def sync_user(db: Session, user: User) -> int:
    """Fetch new mail from all of the user's mailboxes. Returns how many emails were new."""
    new = sum(sync_account(db, acc) for acc in user.accounts)
    user.last_synced_at = datetime.now(UTC)
    db.commit()
    return new


def is_stale(user: User) -> bool:
    """True when the user's mail has not been synced within SYNC_INTERVAL_MINUTES."""
    if user.last_synced_at is None:
        return True
    age = datetime.now(UTC) - as_utc(user.last_synced_at)
    return age > timedelta(minutes=get_settings().sync_interval_minutes)


def process_user_ai(
    user_id: int, classify_limit: int = 200, recommend_limit: int | None = None
) -> int:
    """Run the AI over the user's unsorted emails. Never raises (NFR-24)."""
    from app.services import ai_bridge

    with SessionLocal() as db:
        user = db.get(User, user_id)
        if not user:
            return 0
        try:
            done = ai_bridge.process_pending(db, user, limit=classify_limit)
            if recommend_limit is None:
                ai_bridge.recommend_pending(db, user)
            else:
                ai_bridge.recommend_pending(db, user, limit=recommend_limit)
            return done
        except Exception:
            log.exception("AI processing failed for user %s; will retry next sync", user_id)
            return 0


def sync_user_by_id(user_id: int) -> int:
    """Sync + AI, used after sign-in and by the scheduler."""
    with SessionLocal() as db:
        user = db.get(User, user_id)
        new = sync_user(db, user) if user else 0
    process_user_ai(user_id)  # also retries emails left unsorted earlier
    return new


def sync_everyone(time_budget_s: float | None = None) -> dict:
    """Sync + AI for every user. With a time budget (serverless cron), stop early and
    report how many users are left for the next run."""
    started = time.monotonic()
    with SessionLocal() as db:
        user_ids = list(db.scalars(select(User.id).order_by(User.last_synced_at.asc())))
    done = 0
    for user_id in user_ids:
        if time_budget_s is not None and time.monotonic() - started > time_budget_s:
            break
        try:
            sync_user_by_id(user_id)
        except Exception:
            log.exception("Sync failed for user %s", user_id)
        done += 1
    return {"users": len(user_ids), "synced": done}


async def run_scheduler() -> None:
    interval = get_settings().sync_interval_minutes * 60
    while True:
        await asyncio.sleep(interval)
        await asyncio.to_thread(sync_everyone)
