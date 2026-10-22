"""Import every model here so Alembic autogenerate sees all tables."""

from app.models.ad import Ad, SavedAd
from app.models.base import Base
from app.models.cv_profile import CVProfile
from app.models.email import Email, EmailDetail
from app.models.organisation import Organisation
from app.models.recommendation import Recommendation
from app.models.user import User, UserToken

__all__ = [
    "Ad",
    "Base",
    "CVProfile",
    "Email",
    "EmailDetail",
    "Organisation",
    "Recommendation",
    "SavedAd",
    "User",
    "UserToken",
]
