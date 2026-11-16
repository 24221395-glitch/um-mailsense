"""The student's synced inbox: list, filter by segment, search, read, re-segment, sync now."""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import case, func, or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.graph.mail_sync import process_user_ai, sync_user
from app.models import Email, User
from app.schemas.email import (
    EmailDetailOut,
    EmailPage,
    EmailUpdate,
    SegmentCount,
    SyncResult,
)
from app.services.ai_bridge import SEGMENTS

router = APIRouter(prefix="/api/v1/emails", tags=["emails"])

UNSORTED = "UNSORTED"  # query value for emails the AI has not classified yet


@router.get("", response_model=EmailPage)
def list_emails(
    segment: str | None = None,
    q: str | None = Query(None, max_length=200),
    for_you: bool = False,
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = select(Email).where(Email.user_id == user.id)
    if segment == UNSORTED:
        stmt = stmt.where(Email.segment.is_(None))
    elif segment:
        stmt = stmt.where(Email.segment == segment)
    if for_you:
        stmt = stmt.where(Email.recommendation == "for_you")
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(
                Email.subject.ilike(like),
                Email.sender_name.ilike(like),
                Email.sender_email.ilike(like),
                Email.snippet.ilike(like),
            )
        )
    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    order = (
        (Email.recommendation_score.desc().nulls_last(), Email.received_at.desc())
        if for_you
        else (Email.received_at.desc(),)
    )
    items = db.scalars(stmt.order_by(*order).offset((page - 1) * page_size).limit(page_size))
    return EmailPage(items=list(items), total=total or 0, page=page, page_size=page_size)


@router.get("/segment-counts", response_model=list[SegmentCount])
def segment_counts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Total and unread emails per segment (FR-16)."""
    rows = db.execute(
        select(
            Email.segment,
            func.count(),
            func.sum(case((Email.is_read.is_(False), 1), else_=0)),
        )
        .where(Email.user_id == user.id)
        .group_by(Email.segment)
    )
    return [SegmentCount(code=seg, total=total, unread=unread or 0) for seg, total, unread in rows]


@router.post("/sync", response_model=SyncResult)
async def sync_now(
    background: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch new mail now; the AI sorts it in the background (it shows as "Sorting…")."""
    new = await run_in_threadpool(sync_user, db, user)
    background.add_task(process_user_ai, user.id)
    return SyncResult(new_emails=new)


def _owned(db: Session, user: User, email_id: int) -> Email:
    email = db.get(Email, email_id)
    if not email or email.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Email not found")
    return email


@router.get("/{email_id}", response_model=EmailDetailOut)
def get_email(email_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _owned(db, user, email_id)


@router.patch("/{email_id}", response_model=EmailDetailOut)
def update_email(
    email_id: int,
    body: EmailUpdate,
    background: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark read/unread (in MailSense only) or move to another segment (FR-18).

    A move is remembered: future mail from the same sender goes to that segment (FR-19).
    """
    email = _owned(db, user, email_id)
    if body.is_read is not None:
        email.is_read = body.is_read
    if body.segment is not None and body.segment != email.segment:
        if body.segment not in SEGMENTS:
            raise HTTPException(422, "Unknown segment")
        email.segment = body.segment
        email.segment_is_manual = True
        email.segment_reason = "Moved by you"
        # the "for you" label depends on the segment: score it again
        email.recommendation = email.recommendation_score = email.recommendation_reason = None
        background.add_task(process_user_ai, user.id)
    db.commit()
    return email
