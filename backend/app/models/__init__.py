"""Import every model here so Alembic and create_all() see all tables."""

from app.models.cv_profile import CVProfile
from app.models.email import Email
from app.models.user import OAuthAccount, User

__all__ = ["CVProfile", "Email", "OAuthAccount", "User"]
