"""Import every model here so Alembic and create_all() see all tables."""

from app.models.ad import AD_CATEGORIES, Ad, AdReport, AdSave
from app.models.cv_profile import CVProfile
from app.models.email import Email
from app.models.organisation import Organisation
from app.models.recommendation import AdRecommendation
from app.models.user import OAuthAccount, User

__all__ = [
    "AD_CATEGORIES",
    "Ad",
    "AdRecommendation",
    "AdReport",
    "AdSave",
    "CVProfile",
    "Email",
    "OAuthAccount",
    "Organisation",
    "User",
]
