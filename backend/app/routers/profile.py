"""Profile, CV, recommendations and deadlines. Routes: Raihan · AI: Iqbal (W3-AI-03, due 10 Nov)."""

from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, File, Query, UploadFile

from app.core.security import get_current_user_id
from app.routers import not_built
from app.schemas.profile import DeadlineOut, ProfileOut, ProfilePatch, RecommendationOut
from app.services.ai_bridge import RecLabel

router = APIRouter(tags=["profile"])


@router.get("/me/profile", response_model=ProfileOut)
def get_profile(user_id: str = Depends(get_current_user_id)):
    raise not_built("W3-AI-03")


@router.patch("/me/profile", response_model=ProfileOut)
def update_profile(body: ProfilePatch, user_id: str = Depends(get_current_user_id)):
    raise not_built("W3-AI-03")


@router.post("/me/cv", response_model=ProfileOut)
def upload_cv(file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
    """PDF only, max 5 MB. Parsed with ai_bridge.build_profile()."""
    raise not_built("W3-AI-03")


@router.get("/me/recommendations", response_model=list[RecommendationOut])
def recommendations(
    item_type: Literal["email", "ad"] | None = None,
    label: RecLabel | None = None,
    user_id: str = Depends(get_current_user_id),
):
    raise not_built("W3-AI-03")


@router.get("/me/deadlines", response_model=list[DeadlineOut])
def deadlines(
    from_: datetime | None = Query(None, alias="from"),
    to: datetime | None = None,
    user_id: str = Depends(get_current_user_id),
):
    raise not_built("W3-BE-01")
