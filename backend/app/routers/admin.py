"""Administrator tools (FR-37, FR-38, FR-39, FR-41). Admin role only (NFR-07).

Admins are the emails listed in ADMIN_EMAILS (they get the role when they sign in).
"""

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_role
from app.models import Ad, AdReport, AdSave, Email, Organisation, User
from app.routers.ads import to_out
from app.schemas.ads import (
    AdminAdOut,
    AdminOrganisationOut,
    AdModerationIn,
    ReviewIn,
    StatsOut,
)
from app.services import ai_bridge

router = APIRouter(
    prefix="/api/v1/admin", tags=["admin"], dependencies=[Depends(require_role("admin"))]
)


@router.get("/organisations", response_model=list[AdminOrganisationOut])
def list_organisations(
    status_: str = Query("pending", alias="status"), db: Session = Depends(get_db)
):
    orgs = db.scalars(
        select(Organisation).where(Organisation.status == status_).order_by(Organisation.applied_at)
    ).all()
    return [{**o.__dict__, "owner_email": o.owner.email} for o in orgs]


def _review(db: Session, org_id: int, new_status: str, note: str | None) -> dict:
    org = db.get(Organisation, org_id)
    if org is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organisation not found")
    org.status, org.review_note = new_status, note
    org.reviewed_at = datetime.now(UTC)
    db.commit()
    return {**org.__dict__, "owner_email": org.owner.email}


@router.post("/organisations/{org_id}/approve", response_model=AdminOrganisationOut)
def approve_organisation(org_id: int, body: ReviewIn | None = None, db: Session = Depends(get_db)):
    return _review(db, org_id, "approved", body.note if body else None)


@router.post("/organisations/{org_id}/reject", response_model=AdminOrganisationOut)
def reject_organisation(org_id: int, body: ReviewIn, db: Session = Depends(get_db)):
    """Rejecting (or later revoking) hides all of the organisation's posts from the board."""
    return _review(db, org_id, "rejected", body.note)


def _ad_rows(db: Session, ads: list[Ad]) -> list[dict]:
    ids = [a.id for a in ads]
    saves = dict(
        db.execute(
            select(AdSave.ad_id, func.count()).where(AdSave.ad_id.in_(ids)).group_by(AdSave.ad_id)
        ).all()
    )
    reasons: dict[int, list[str]] = {}
    for ad_id, reason in db.execute(
        select(AdReport.ad_id, AdReport.reason).where(
            AdReport.ad_id.in_(ids), AdReport.resolved.is_(False)
        )
    ):
        reasons.setdefault(ad_id, []).append(reason)
    return [
        to_out(
            a,
            set(),
            {},
            status=a.status,
            views=a.views,
            saves=saves.get(a.id, 0),
            open_reports=len(reasons.get(a.id, [])),
            report_reasons=reasons.get(a.id, []),
        )
        for a in ads
    ]


@router.get("/ads", response_model=list[AdminAdOut])
def list_ads(
    status_: str | None = Query(None, alias="status"),
    reported: bool = False,
    db: Session = Depends(get_db),
):
    """All posts for moderation; `reported=true` shows only posts with open reports."""
    stmt = select(Ad).order_by(Ad.created_at.desc()).limit(200)
    if status_:
        stmt = stmt.where(Ad.status == status_)
    if reported:
        stmt = stmt.where(Ad.id.in_(select(AdReport.ad_id).where(AdReport.resolved.is_(False))))
    return _ad_rows(db, db.scalars(stmt).all())


@router.patch("/ads/{ad_id}", response_model=AdminAdOut)
def moderate_ad(ad_id: int, body: AdModerationIn, db: Session = Depends(get_db)):
    """Approve, hide or remove a post (FR-38). Its open reports are marked resolved."""
    ad = db.get(Ad, ad_id)
    if ad is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    ad.status = body.status
    db.execute(update(AdReport).where(AdReport.ad_id == ad_id).values(resolved=True))
    db.commit()
    return _ad_rows(db, [ad])[0]


@router.get("/stats", response_model=StatsOut)
def stats(db: Session = Depends(get_db)):
    """Usage report for the admin dashboard (FR-41)."""
    week_ago = datetime.now(UTC) - timedelta(days=7)
    count = lambda stmt: db.scalar(stmt) or 0  # noqa: E731
    return StatsOut(
        users=count(select(func.count(User.id))),
        active_users_7d=count(select(func.count(User.id)).where(User.last_synced_at >= week_ago)),
        emails=count(select(func.count(Email.id))),
        emails_classified=count(select(func.count(Email.id)).where(Email.segment.is_not(None))),
        organisations_pending=count(
            select(func.count(Organisation.id)).where(Organisation.status == "pending")
        ),
        organisations_approved=count(
            select(func.count(Organisation.id)).where(Organisation.status == "approved")
        ),
        ads_live=count(select(func.count(Ad.id)).where(Ad.status == "approved")),
        reports_open=count(select(func.count(AdReport.id)).where(AdReport.resolved.is_(False))),
        segments_30d={
            seg: n
            for seg, n in db.execute(
                select(Email.segment, func.count(Email.id))
                .where(
                    Email.segment.is_not(None),
                    Email.received_at >= datetime.now(UTC) - timedelta(days=30),
                )
                .group_by(Email.segment)
            )
        },
        llm=ai_bridge.usage(),
    )
