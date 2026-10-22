import uuid

from sqlalchemy import Float, ForeignKey, String, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, CreatedAt, UUIDPk


class Recommendation(UUIDPk, CreatedAt, Base):
    __tablename__ = "recommendations"
    __table_args__ = (UniqueConstraint("user_id", "item_type", "item_id"),)

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"))
    item_type: Mapped[str] = mapped_column(String)  # email | ad
    item_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    score: Mapped[float] = mapped_column(Float)
    label: Mapped[str] = mapped_column(String)  # FOR_YOU | NOT_FOR_YOU
    reason: Mapped[str | None] = mapped_column(Text)
