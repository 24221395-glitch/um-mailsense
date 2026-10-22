import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, CreatedAt, UUIDPk


class Email(UUIDPk, CreatedAt, Base):
    __tablename__ = "emails"
    __table_args__ = (UniqueConstraint("user_id", "graph_message_id"),)

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"))
    graph_message_id: Mapped[str] = mapped_column(String)
    subject: Mapped[str | None] = mapped_column(Text)
    sender_name: Mapped[str | None] = mapped_column(String)
    sender_address: Mapped[str | None] = mapped_column(String)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    body_preview: Mapped[str | None] = mapped_column(Text)
    segment: Mapped[str] = mapped_column(String)  # Segment code from contracts.py
    segment_source: Mapped[str] = mapped_column(String, default="ai")  # ai | user
    confidence: Mapped[float | None] = mapped_column(Float)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)


class EmailDetail(Base):
    __tablename__ = "email_details"

    email_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("emails.id", ondelete="CASCADE"), primary_key=True
    )
    deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    venue: Mapped[str | None] = mapped_column(String)
    organiser: Mapped[str | None] = mapped_column(String)
    link: Mapped[str | None] = mapped_column(Text)
