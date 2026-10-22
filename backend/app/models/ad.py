import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, CreatedAt, UUIDPk, utcnow


class Ad(UUIDPk, CreatedAt, Base):
    __tablename__ = "ads"

    organisation_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("organisations.id", ondelete="CASCADE")
    )
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String)  # Segment code
    event_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    link: Mapped[str | None] = mapped_column(Text)
    tags: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    status: Mapped[str] = mapped_column(String, default="pending")  # pending | approved | removed


class SavedAd(Base):
    __tablename__ = "saved_ads"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    ad_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("ads.id", ondelete="CASCADE"), primary_key=True
    )
    saved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
