"""Ad board and organisation routes (W3-BE-02, due 8 Nov). Owner: Raihan."""

import uuid

from fastapi import APIRouter, Depends, Query, status

from app.core.security import get_current_user_id
from app.routers import not_built
from app.schemas.ad import AdIn, AdOut, OrganisationIn, OrganisationOut
from app.schemas.common import Page
from app.services.ai_bridge import Segment

router = APIRouter(tags=["ads"])


@router.get("/ads", response_model=Page[AdOut])
def list_ads(
    category: Segment | None = None,
    q: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
):
    raise not_built("W3-BE-02")


@router.get("/ads/{ad_id}", response_model=AdOut)
def get_ad(ad_id: uuid.UUID, user_id: str = Depends(get_current_user_id)):
    raise not_built("W3-BE-02")


@router.post("/ads", response_model=AdOut, status_code=status.HTTP_201_CREATED)
def create_ad(body: AdIn, user_id: str = Depends(get_current_user_id)):
    raise not_built("W3-BE-02")


@router.post("/ads/{ad_id}/save", status_code=status.HTTP_204_NO_CONTENT)
def save_ad(ad_id: uuid.UUID, user_id: str = Depends(get_current_user_id)):
    raise not_built("W3-BE-02")


@router.delete("/ads/{ad_id}/save", status_code=status.HTTP_204_NO_CONTENT)
def unsave_ad(ad_id: uuid.UUID, user_id: str = Depends(get_current_user_id)):
    raise not_built("W3-BE-02")


@router.get("/me/saved-ads", response_model=list[AdOut])
def saved_ads(user_id: str = Depends(get_current_user_id)):
    raise not_built("W3-BE-02")


@router.post("/organisations", response_model=OrganisationOut, status_code=status.HTTP_201_CREATED)
def register_organisation(body: OrganisationIn, user_id: str = Depends(get_current_user_id)):
    raise not_built("W3-BE-02")


@router.get("/organisations/me", response_model=OrganisationOut)
def my_organisation(user_id: str = Depends(get_current_user_id)):
    raise not_built("W3-BE-02")
