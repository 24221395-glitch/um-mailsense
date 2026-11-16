"""Clubs and organisations apply for a verified account (FR-27)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Organisation, User
from app.schemas.ads import OrganisationIn, OrganisationOut

router = APIRouter(prefix="/api/v1/organisations", tags=["organisations"])


def my_organisation(db: Session, user: User) -> Organisation | None:
    return db.scalar(select(Organisation).where(Organisation.owner_user_id == user.id))


def require_approved_org(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> Organisation:
    """Dependency: the signed-in user owns an approved organisation (NFR-07)."""
    org = my_organisation(db, user)
    if org is None or org.status != "approved":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only verified organisations can do this")
    return org


@router.get("/mine", response_model=OrganisationOut | None)
def get_mine(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return my_organisation(db, user)


@router.post("", response_model=OrganisationOut, status_code=status.HTTP_201_CREATED)
def apply(
    body: OrganisationIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if my_organisation(db, user):
        raise HTTPException(status.HTTP_409_CONFLICT, "You already have an organisation")
    org = Organisation(
        owner_user_id=user.id,
        **body.model_dump(exclude={"website"}),
        website=str(body.website) if body.website else None,
    )
    db.add(org)
    db.commit()
    return org


@router.put("/mine", response_model=OrganisationOut)
def update_mine(
    body: OrganisationIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Edit details. A rejected application goes back to pending for another review."""
    org = my_organisation(db, user)
    if org is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No organisation yet")
    for key, value in body.model_dump(exclude={"website"}).items():
        setattr(org, key, value)
    org.website = str(body.website) if body.website else None
    if org.status == "rejected":
        org.status, org.review_note = "pending", None
    db.commit()
    return org
