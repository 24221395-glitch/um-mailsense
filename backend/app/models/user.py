from datetime import UTC, datetime

from sqlalchemy import JSON, ForeignKey, String, UniqueConstraint, true
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, UTCDateTime
from app.core.security import EncryptedText


def utcnow() -> datetime:
    return datetime.now(UTC)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200), default="")
    # student | organisation | admin
    role: Mapped[str] = mapped_column(String(20), default="student")
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
    last_synced_at: Mapped[datetime | None] = mapped_column(UTCDateTime)

    # Deadline reminders (FR-35/36): on/off, and segments the student muted.
    notify_enabled: Mapped[bool] = mapped_column(default=True, server_default=true())
    notify_muted_segments: Mapped[list[str]] = mapped_column(
        JSON, default=list, server_default="[]"
    )

    accounts: Mapped[list["OAuthAccount"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class OAuthAccount(Base):
    """A connected mailbox: Microsoft (Siswamail/Outlook) or Google (Gmail).

    Tokens are encrypted at rest.
    """

    __tablename__ = "oauth_accounts"
    __table_args__ = (UniqueConstraint("provider", "provider_user_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    provider: Mapped[str] = mapped_column(String(20))  # microsoft | google
    provider_user_id: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(320))
    access_token: Mapped[str] = mapped_column(EncryptedText)
    refresh_token: Mapped[str | None] = mapped_column(EncryptedText)
    expires_at: Mapped[datetime] = mapped_column(UTCDateTime)
    # Set when the provider rejects our refresh token (user revoked access) → ask to sign in again.
    needs_reconnect: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)

    user: Mapped[User] = relationship(back_populates="accounts")
