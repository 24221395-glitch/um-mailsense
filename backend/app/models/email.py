from datetime import datetime

from sqlalchemy import Float, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, UTCDateTime
from app.core.security import EncryptedText
from app.models.user import utcnow


class Email(Base):
    __tablename__ = "emails"
    __table_args__ = (UniqueConstraint("account_id", "provider_message_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    account_id: Mapped[int] = mapped_column(ForeignKey("oauth_accounts.id", ondelete="CASCADE"))
    provider_message_id: Mapped[str] = mapped_column(String(512))

    sender_name: Mapped[str] = mapped_column(String(300), default="")
    sender_email: Mapped[str] = mapped_column(String(320), default="")
    subject: Mapped[str] = mapped_column(String(1000), default="")
    snippet: Mapped[str] = mapped_column(Text, default="")
    body_text: Mapped[str] = mapped_column(EncryptedText, default="")  # encrypted at rest (NFR-03)
    received_at: Mapped[datetime] = mapped_column(UTCDateTime, index=True)
    is_read: Mapped[bool] = mapped_column(default=False)
    web_link: Mapped[str | None] = mapped_column(String(2000))

    # Filled by the AI (classified once, never re-sent — FR-14)
    segment: Mapped[str | None] = mapped_column(String(40), index=True)
    segment_confidence: Mapped[float | None] = mapped_column(Float)
    segment_is_manual: Mapped[bool] = mapped_column(default=False)
    segment_reason: Mapped[str | None] = mapped_column(String(300))
    ai_attempts: Mapped[int] = mapped_column(default=0, server_default="0")
    classified_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    deadline: Mapped[datetime | None] = mapped_column(UTCDateTime, index=True)
    event_date: Mapped[datetime | None] = mapped_column(UTCDateTime)
    venue: Mapped[str | None] = mapped_column(String(500))
    organiser: Mapped[str | None] = mapped_column(String(300))
    registration_link: Mapped[str | None] = mapped_column(String(2000))

    # Filled by the recommender
    recommendation: Mapped[str | None] = mapped_column(String(20))  # for_you | not_for_you
    recommendation_score: Mapped[float | None] = mapped_column(Float)
    recommendation_reason: Mapped[str | None] = mapped_column(String(500))

    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
