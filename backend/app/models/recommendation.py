from datetime import datetime

from sqlalchemy import Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, UTCDateTime
from app.models.user import utcnow


class AdRecommendation(Base):
    """How well a board post matches one student's profile (FR-23/24).

    Email recommendations live on the emails table; posts are shared by everyone, so their
    per-student scores live here. Rows are deleted when the profile or the post changes.
    """

    __tablename__ = "ad_recommendations"
    __table_args__ = (UniqueConstraint("user_id", "ad_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    ad_id: Mapped[int] = mapped_column(ForeignKey("ads.id", ondelete="CASCADE"), index=True)
    label: Mapped[str] = mapped_column(String(20))  # for_you | not_for_you
    score: Mapped[float] = mapped_column(Float)
    reason: Mapped[str] = mapped_column(String(300), default="")
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
