import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, utcnow


class CVProfile(Base):
    __tablename__ = "cv_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    field_of_study: Mapped[str | None] = mapped_column(String)
    year_of_study: Mapped[int | None] = mapped_column(Integer)
    skills: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    interests: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    cv_file_path: Mapped[str | None] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )
