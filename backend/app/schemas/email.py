from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_serializer

from app.graph.mail_sync import as_utc


class EmailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sender_name: str
    sender_email: str
    subject: str
    snippet: str
    received_at: datetime
    is_read: bool
    segment: str | None
    deadline: datetime | None
    recommendation: str | None

    @field_serializer("received_at", "deadline")
    def _utc(self, dt: datetime | None):
        return as_utc(dt).isoformat() if dt else None


class EmailDetailOut(EmailOut):
    body_text: str
    web_link: str | None
    event_date: datetime | None
    venue: str | None
    organiser: str | None
    registration_link: str | None
    segment_confidence: float | None
    segment_is_manual: bool
    segment_reason: str | None
    recommendation_reason: str | None

    @field_serializer("event_date")
    def _utc_event(self, dt: datetime | None):
        return as_utc(dt).isoformat() if dt else None


class EmailPage(BaseModel):
    items: list[EmailOut]
    total: int
    page: int
    page_size: int


class SegmentCount(BaseModel):
    code: str | None  # None = not classified yet
    total: int
    unread: int


class EmailUpdate(BaseModel):
    is_read: bool | None = None
    segment: str | None = None


class SyncResult(BaseModel):
    new_emails: int
