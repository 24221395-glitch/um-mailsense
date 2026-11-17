from datetime import datetime

from sqlalchemy import JSON, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, UTCDateTime
from app.models.organisation import Organisation
from app.models.user import utcnow

# Organisations may post in these segments (not UM_NOTICE or NOT_FOR_ME).
AD_CATEGORIES = ("HACKATHON", "RESEARCH", "EVENT", "SCHOLARSHIP_CAREER", "CLUB")


class Ad(Base):
    """A post on the community advertisement board (FR-28/29)."""

    __tablename__ = "ads"

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(
        ForeignKey("organisations.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String(40), index=True)
    event_date: Mapped[datetime | None] = mapped_column(UTCDateTime, index=True)
    deadline: Mapped[datetime | None] = mapped_column(UTCDateTime)
    venue: Mapped[str | None] = mapped_column(String(300))
    link: Mapped[str | None] = mapped_column(String(1000))
    image_url: Mapped[str | None] = mapped_column(String(1000))
    faculty: Mapped[str | None] = mapped_column(String(200), index=True)  # None = all faculties
    target_fields: Mapped[list[str]] = mapped_column(JSON, default=list)  # FR-32
    # pending | approved | hidden | removed
    status: Mapped[str] = mapped_column(String(20), default="approved", index=True)
    views: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, onupdate=utcnow)

    organisation: Mapped[Organisation] = relationship()


class AdSave(Base):
    """A student bookmarked a post (FR-31)."""

    __tablename__ = "ad_saves"
    __table_args__ = (UniqueConstraint("user_id", "ad_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    ad_id: Mapped[int] = mapped_column(ForeignKey("ads.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)


class AdReport(Base):
    """A student flagged a post as inappropriate (FR-39)."""

    __tablename__ = "ad_reports"
    __table_args__ = (UniqueConstraint("user_id", "ad_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    ad_id: Mapped[int] = mapped_column(ForeignKey("ads.id", ondelete="CASCADE"), index=True)
    reason: Mapped[str] = mapped_column(String(500))
    resolved: Mapped[bool] = mapped_column(default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
