from datetime import datetime

from sqlalchemy import JSON, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, UTCDateTime
from app.models.user import utcnow


class CVProfile(Base):
    """The student's profile used for recommendations (FR-21/22/26).

    The uploaded CV file itself is never stored: it is read in memory, turned into this
    profile and discarded (data minimisation, PDPA).
    """

    __tablename__ = "cv_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    field_of_study: Mapped[str | None] = mapped_column(String(200))
    year_of_study: Mapped[int | None]
    skills: Mapped[list[str]] = mapped_column(JSON, default=list)
    interests: Mapped[list[str]] = mapped_column(JSON, default=list)
    summary: Mapped[str] = mapped_column(String(300), default="")
    source: Mapped[str] = mapped_column(String(20), default="manual")  # cv | manual
    cv_filename: Mapped[str | None] = mapped_column(String(255))
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, onupdate=utcnow)
