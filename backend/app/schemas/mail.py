import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.services.ai_bridge import RecLabel, Segment


class EmailDetailsOut(BaseModel):
    deadline: datetime | None = None
    venue: str | None = None
    organiser: str | None = None
    link: str | None = None


class EmailOut(BaseModel):
    id: uuid.UUID
    subject: str | None
    sender_name: str | None
    sender_address: str | None
    received_at: datetime
    body_preview: str | None
    segment: Segment
    segment_source: Literal["ai", "user"]
    confidence: float | None
    is_read: bool
    details: EmailDetailsOut | None = None
    recommendation: RecLabel | None = None


class EmailPatch(BaseModel):
    segment: Segment | None = None
    is_read: bool | None = None


class SegmentCount(BaseModel):
    segment: Segment
    label: str
    total: int
    unread: int


class SyncQueued(BaseModel):
    queued: bool
