import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.services.ai_bridge import RecLabel, Segment


class AdIn(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10)
    category: Segment
    event_date: datetime | None = None
    deadline: datetime | None = None
    link: str | None = None
    tags: list[str] = []


class AdOut(BaseModel):
    id: uuid.UUID
    organisation_id: uuid.UUID
    organisation_name: str
    title: str
    description: str
    category: Segment
    event_date: datetime | None
    deadline: datetime | None
    link: str | None
    tags: list[str]
    status: Literal["pending", "approved", "removed"]
    saved: bool = False
    recommendation: RecLabel | None = None


class OrganisationIn(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    contact_email: str
    description: str | None = None


class OrganisationOut(BaseModel):
    id: uuid.UUID
    name: str
    contact_email: str
    description: str | None
    status: Literal["pending", "approved", "rejected"]
