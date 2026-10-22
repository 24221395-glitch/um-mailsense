"""Admin routes (W3-BE-03, due 9 Nov). Owner: Raihan. Role "admin" only, otherwise 403."""

import uuid
from typing import Literal

from fastapi import APIRouter, Depends, Query, status

from app.core.security import get_current_user_id
from app.routers import not_built
from app.schemas.ad import AdOut, OrganisationOut
from app.schemas.admin import StatsOut

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/organisations", response_model=list[OrganisationOut])
def list_organisations(
    status_: Literal["pending", "approved", "rejected"] | None = Query(None, alias="status"),
    user_id: str = Depends(get_current_user_id),
):
    raise not_built("W3-BE-03")


@router.post("/organisations/{org_id}/approve", response_model=OrganisationOut)
def approve_organisation(org_id: uuid.UUID, user_id: str = Depends(get_current_user_id)):
    raise not_built("W3-BE-03")


@router.post("/organisations/{org_id}/reject", response_model=OrganisationOut)
def reject_organisation(org_id: uuid.UUID, user_id: str = Depends(get_current_user_id)):
    raise not_built("W3-BE-03")


@router.get("/ads", response_model=list[AdOut])
def list_ads_for_review(
    status_: Literal["pending", "approved", "removed"] | None = Query(None, alias="status"),
    user_id: str = Depends(get_current_user_id),
):
    raise not_built("W3-BE-03")


@router.post("/ads/{ad_id}/approve", response_model=AdOut)
def approve_ad(ad_id: uuid.UUID, user_id: str = Depends(get_current_user_id)):
    raise not_built("W3-BE-03")


@router.delete("/ads/{ad_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_ad(ad_id: uuid.UUID, user_id: str = Depends(get_current_user_id)):
    raise not_built("W3-BE-03")


@router.get("/stats", response_model=StatsOut)
def stats(user_id: str = Depends(get_current_user_id)):
    raise not_built("W3-BE-03")
