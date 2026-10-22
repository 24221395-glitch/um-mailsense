import uuid

from sqlalchemy import ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, CreatedAt, UUIDPk


class Organisation(UUIDPk, CreatedAt, Base):
    __tablename__ = "organisations"

    name: Mapped[str] = mapped_column(String)
    contact_email: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String, default="pending")  # pending | approved | rejected
    owner_user_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id"))
