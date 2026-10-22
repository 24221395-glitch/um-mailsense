import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, CreatedAt, UUIDPk


class User(UUIDPk, CreatedAt, Base):
    __tablename__ = "users"

    ms_oid: Mapped[str] = mapped_column(String, unique=True)
    email: Mapped[str] = mapped_column(String, unique=True)
    display_name: Mapped[str | None] = mapped_column(String)
    role: Mapped[str] = mapped_column(String, default="student")  # student | org_admin | admin
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class UserToken(Base):
    __tablename__ = "user_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    refresh_token_encrypted: Mapped[str] = mapped_column(Text)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
