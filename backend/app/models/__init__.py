"""Import every model here so Alembic and create_all() see all tables."""

from app.models.email import Email
from app.models.user import OAuthAccount, User

__all__ = ["Email", "OAuthAccount", "User"]
