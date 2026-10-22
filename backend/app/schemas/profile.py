import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ItemType
from app.services.ai_bridge import RecLabel


class ProfileOut(BaseModel):
    field_of_study: str | None = None
    year_of_study: int | None = None
    skills: list[str] = []
    interests: list[str] = []
    has_cv: bool = False
    updated_at: datetime | None = None


class ProfilePatch(BaseModel):
    field_of_study: str | None = None
    year_of_study: int | None = None
    skills: list[str] | None = None
    interests: list[str] | None = None


class RecommendationOut(BaseModel):
    item_type: ItemType
    item_id: uuid.UUID
    score: float
    label: RecLabel
    reason: str | None = None


class DeadlineOut(BaseModel):
    item_type: ItemType
    item_id: uuid.UUID
    title: str
    deadline: datetime
