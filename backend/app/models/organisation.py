from datetime import datetime

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, UTCDateTime
from app.models.user import User, utcnow


class Organisation(Base):
    """A club / society / office that applied for a verified account (FR-27, FR-37).

    It is owned by one signed-in user. Only an *approved* organisation can post on the board.
    """

    __tablename__ = "organisations"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    contact_email: Mapped[str] = mapped_column(String(320))
    website: Mapped[str | None] = mapped_column(String(500))
    faculty: Mapped[str | None] = mapped_column(String(200))
    # pending | approved | rejected
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    review_note: Mapped[str | None] = mapped_column(String(500))
    applied_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
    reviewed_at: Mapped[datetime | None] = mapped_column(UTCDateTime)

    owner: Mapped[User] = relationship()
