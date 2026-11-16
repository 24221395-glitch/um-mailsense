"""Deadline calendar (FR-34) and reminder settings (FR-35/36).

The calendar merges dates the AI extracted from the student's emails with dates of board
posts they saved. Reminders are shown by the browser (see frontend DeadlineCalendar).
"""

from datetime import UTC, datetime, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_serializer, field_validator
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Ad, AdSave, Email, Organisation, User
from app.services.ai_bridge import SEGMENTS

router = APIRouter(prefix="/api/v1", tags=["calendar"])

MAX_RANGE_DAYS = 400


class CalendarItem(BaseModel):
    kind: Literal["email", "ad"]
    id: int
    title: str
    source: str  # sender or organisation
    segment: str | None
    date: datetime
    date_type: Literal["deadline", "event"]
    link: str | None

    @field_serializer("date")
    def _ser(self, dt: datetime):
        return dt.astimezone(UTC).isoformat()


class NotificationSettings(BaseModel):
    enabled: bool = True
    muted_segments: list[str] = Field(default_factory=list)

    @field_validator("muted_segments")
    @classmethod
    def _known(cls, v: list[str]) -> list[str]:
        unknown = [s for s in v if s not in SEGMENTS]
        if unknown:
            raise ValueError(f"Unknown segments: {', '.join(unknown)}")
        return sorted(set(v))


def _in_range(column, start: datetime, end: datetime):
    return (column >= start) & (column <= end)


@router.get("/deadlines", response_model=list[CalendarItem])
def deadlines(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Deadlines and event dates between date_from and date_to (default: -1 day to +60 days)."""
    now = datetime.now(UTC)
    start = date_from or now - timedelta(days=1)
    end = date_to or now + timedelta(days=60)
    if end < start or (end - start).days > MAX_RANGE_DAYS:
        raise HTTPException(422, "Invalid date range")

    items: list[CalendarItem] = []

    emails = db.scalars(
        select(Email).where(
            Email.user_id == user.id,
            or_(Email.segment.is_(None), Email.segment != "NOT_FOR_ME"),
            or_(_in_range(Email.deadline, start, end), _in_range(Email.event_date, start, end)),
        )
    )
    for e in emails:
        for date, kind in ((e.deadline, "deadline"), (e.event_date, "event")):
            if date and start <= date <= end:
                items.append(
                    CalendarItem(
                        kind="email",
                        id=e.id,
                        title=e.subject,
                        source=e.sender_name,
                        segment=e.segment,
                        date=date,
                        date_type=kind,
                        link=e.registration_link,
                    )
                )

    ads = db.scalars(
        select(Ad)
        .join(AdSave, (AdSave.ad_id == Ad.id) & (AdSave.user_id == user.id))
        .join(Ad.organisation)
        .where(
            Ad.status == "approved",
            Organisation.status == "approved",
            or_(_in_range(Ad.deadline, start, end), _in_range(Ad.event_date, start, end)),
        )
    )
    for a in ads:
        for date, kind in ((a.deadline, "deadline"), (a.event_date, "event")):
            if date and start <= date <= end:
                items.append(
                    CalendarItem(
                        kind="ad",
                        id=a.id,
                        title=a.title,
                        source=a.organisation.name,
                        segment=a.category,
                        date=date,
                        date_type=kind,
                        link=a.link,
                    )
                )

    return sorted(items, key=lambda i: i.date)


@router.get("/notification-settings", response_model=NotificationSettings)
def get_notification_settings(user: User = Depends(get_current_user)):
    return NotificationSettings(
        enabled=user.notify_enabled, muted_segments=user.notify_muted_segments or []
    )


@router.put("/notification-settings", response_model=NotificationSettings)
def update_notification_settings(
    body: NotificationSettings,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user.notify_enabled = body.enabled
    user.notify_muted_segments = body.muted_segments
    db.commit()
    return body
