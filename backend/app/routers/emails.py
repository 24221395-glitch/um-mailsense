"""Email routes (W3-BE-01, due 6 Nov). Owner: Raihan."""

import uuid

from fastapi import APIRouter, Depends, Query, status

from app.core.security import get_current_user_id
from app.routers import not_built
from app.schemas.common import Page
from app.schemas.mail import EmailOut, EmailPatch, SegmentCount, SyncQueued
from app.services.ai_bridge import Segment

router = APIRouter(tags=["emails"])


@router.get("/segments", response_model=list[SegmentCount])
def list_segments(user_id: str = Depends(get_current_user_id)):
    raise not_built("W3-BE-01")


@router.get("/emails", response_model=Page[EmailOut])
def list_emails(
    segment: Segment | None = None,
    unread_only: bool = False,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
):
    raise not_built("W3-BE-01")


@router.get("/emails/{email_id}", response_model=EmailOut)
def get_email(email_id: uuid.UUID, user_id: str = Depends(get_current_user_id)):
    raise not_built("W3-BE-01")


@router.patch("/emails/{email_id}", response_model=EmailOut)
def update_email(
    email_id: uuid.UUID, body: EmailPatch, user_id: str = Depends(get_current_user_id)
):
    """A segment change sets segment_source = "user" (FR-05)."""
    raise not_built("W3-BE-01")


@router.post("/emails/sync", response_model=SyncQueued, status_code=status.HTTP_202_ACCEPTED)
def trigger_sync(user_id: str = Depends(get_current_user_id)):
    raise not_built("W2-BE-03")
