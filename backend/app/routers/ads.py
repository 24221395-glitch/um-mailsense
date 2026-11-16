"""The community advertisement board (FR-28 to FR-33, FR-39)."""

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import SessionLocal, get_db
from app.core.security import get_current_user
from app.models import AD_CATEGORIES, Ad, AdRecommendation, AdReport, AdSave, Organisation, User
from app.routers.organisations import require_approved_org
from app.schemas.ads import AdIn, AdOut, AdPage, MyAdOut, ReportIn
from app.services import ai_bridge

router = APIRouter(prefix="/api/v1/ads", tags=["ads"])


def to_out(ad: Ad, saved: set[int], recs: dict[int, AdRecommendation], **extra) -> dict:
    rec = recs.get(ad.id)
    return {
        **{c: getattr(ad, c) for c in AdOut.model_fields if hasattr(ad, c)},
        "organisation_name": ad.organisation.name,
        "is_saved": ad.id in saved,
        "recommendation": rec.label if rec else None,
        "recommendation_reason": rec.reason if rec else None,
        **extra,
    }


def _user_state(db: Session, user: User, ad_ids: list[int]):
    saved = set(
        db.scalars(select(AdSave.ad_id).where(AdSave.user_id == user.id, AdSave.ad_id.in_(ad_ids)))
    )
    recs = {
        r.ad_id: r
        for r in db.scalars(
            select(AdRecommendation).where(
                AdRecommendation.user_id == user.id, AdRecommendation.ad_id.in_(ad_ids)
            )
        )
    }
    return saved, recs


def _score_in_background(user_id: int, ad_ids: list[int]) -> None:
    with SessionLocal() as db:
        user = db.get(User, user_id)
        if user:
            ai_bridge.recommend_ads(db, user, ad_ids)


def _live() -> list:
    """Approved posts from organisations that are still approved."""
    return [Ad.status == "approved", Organisation.status == "approved"]


@router.get("", response_model=AdPage)
def list_ads(
    background: BackgroundTasks,
    category: str | None = None,
    faculty: str | None = None,
    q: str | None = Query(None, max_length=200),
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    saved: bool = False,
    for_you: bool = False,
    include_past: bool = False,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Browse posts, filtered by category, faculty and date (FR-29/30)."""
    stmt = select(Ad).join(Ad.organisation).where(*_live())
    if category:
        stmt = stmt.where(Ad.category == category)
    if faculty:  # posts for this faculty, plus posts open to everyone
        stmt = stmt.where(or_(Ad.faculty == faculty, Ad.faculty.is_(None)))
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(Ad.title.ilike(like), Ad.description.ilike(like), Organisation.name.ilike(like))
        )
    if date_from:
        stmt = stmt.where(Ad.event_date >= date_from)
    if date_to:
        stmt = stmt.where(Ad.event_date <= date_to)
    if not include_past:
        yesterday = datetime.now(UTC) - timedelta(days=1)
        stmt = stmt.where(or_(Ad.event_date.is_(None), Ad.event_date >= yesterday))
    if saved:
        stmt = stmt.join(AdSave, (AdSave.ad_id == Ad.id) & (AdSave.user_id == user.id))
    if for_you:
        stmt = stmt.join(
            AdRecommendation,
            (AdRecommendation.ad_id == Ad.id) & (AdRecommendation.user_id == user.id),
        ).where(AdRecommendation.label == "for_you")
        order = (AdRecommendation.score.desc(), Ad.event_date.asc().nulls_last())
    else:
        order = (Ad.event_date.asc().nulls_last(), Ad.created_at.desc())

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    ads = db.scalars(stmt.order_by(*order).offset((page - 1) * page_size).limit(page_size)).all()
    ids = [a.id for a in ads]
    saved_ids, recs = _user_state(db, user, ids)

    missing = [i for i in ids if i not in recs]
    if missing:
        background.add_task(_score_in_background, user.id, missing)
    items = [to_out(a, saved_ids, recs) for a in ads]
    return AdPage(items=items, total=total, page=page, page_size=page_size)


@router.get("/categories")
def categories():
    return list(AD_CATEGORIES)


@router.get("/mine", response_model=list[MyAdOut])
def my_ads(org: Organisation = Depends(require_approved_org), db: Session = Depends(get_db)):
    """The organisation's own posts with views, saves and open reports (FR-33)."""
    ads = db.scalars(
        select(Ad)
        .where(Ad.organisation_id == org.id, Ad.status != "removed")
        .order_by(Ad.created_at.desc())
    ).all()
    ids = [a.id for a in ads]
    saves = dict(
        db.execute(
            select(AdSave.ad_id, func.count()).where(AdSave.ad_id.in_(ids)).group_by(AdSave.ad_id)
        ).all()
    )
    reports = dict(
        db.execute(
            select(AdReport.ad_id, func.count())
            .where(AdReport.ad_id.in_(ids), AdReport.resolved.is_(False))
            .group_by(AdReport.ad_id)
        ).all()
    )
    return [
        to_out(
            a,
            set(),
            {},
            status=a.status,
            views=a.views,
            saves=saves.get(a.id, 0),
            open_reports=reports.get(a.id, 0),
        )
        for a in ads
    ]


def _visible_ad(db: Session, ad_id: int) -> Ad:
    ad = db.scalar(select(Ad).join(Ad.organisation).where(Ad.id == ad_id, *_live()))
    if ad is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    return ad


@router.get("/{ad_id}", response_model=AdOut)
def get_ad(ad_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ad = _visible_ad(db, ad_id)
    if ad.organisation.owner_user_id != user.id:
        ad.views += 1
        db.commit()
    saved, recs = _user_state(db, user, [ad.id])
    return to_out(ad, saved, recs)


@router.post("", response_model=MyAdOut, status_code=status.HTTP_201_CREATED)
def create_ad(
    body: AdIn, org: Organisation = Depends(require_approved_org), db: Session = Depends(get_db)
):
    status_ = "pending" if get_settings().ads_require_approval else "approved"
    ad = Ad(organisation_id=org.id, status=status_, **body.to_columns())
    db.add(ad)
    db.commit()
    db.refresh(ad)
    return to_out(ad, set(), {}, status=ad.status, views=0, saves=0, open_reports=0)


def _own_ad(db: Session, org: Organisation, ad_id: int) -> Ad:
    ad = db.get(Ad, ad_id)
    if ad is None or ad.organisation_id != org.id or ad.status == "removed":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    return ad


@router.put("/{ad_id}", response_model=MyAdOut)
def update_ad(
    ad_id: int,
    body: AdIn,
    org: Organisation = Depends(require_approved_org),
    db: Session = Depends(get_db),
):
    ad = _own_ad(db, org, ad_id)
    for key, value in body.to_columns().items():
        setattr(ad, key, value)
    ai_bridge.forget_ad_scores(db, ad.id)  # content changed: rescore for everyone
    db.commit()
    db.refresh(ad)
    saves = db.scalar(select(func.count()).where(AdSave.ad_id == ad.id)) or 0
    return to_out(ad, set(), {}, status=ad.status, views=ad.views, saves=saves, open_reports=0)


@router.delete("/{ad_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ad(
    ad_id: int, org: Organisation = Depends(require_approved_org), db: Session = Depends(get_db)
):
    db.delete(_own_ad(db, org, ad_id))
    db.commit()


@router.post("/{ad_id}/save", status_code=status.HTTP_204_NO_CONTENT)
def save_ad(ad_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _visible_ad(db, ad_id)
    db.add(AdSave(user_id=user.id, ad_id=ad_id))
    try:
        db.commit()
    except IntegrityError:  # already saved
        db.rollback()


@router.delete("/{ad_id}/save", status_code=status.HTTP_204_NO_CONTENT)
def unsave_ad(ad_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.scalar(select(AdSave).where(AdSave.user_id == user.id, AdSave.ad_id == ad_id))
    if row:
        db.delete(row)
        db.commit()


@router.post("/{ad_id}/reports", status_code=status.HTTP_201_CREATED)
def report_ad(
    ad_id: int,
    body: ReportIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Flag a post for admin review (FR-39). One report per student per post."""
    _visible_ad(db, ad_id)
    db.add(AdReport(user_id=user.id, ad_id=ad_id, reason=body.reason.strip()))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "You already reported this post") from None
    return {"status": "reported"}
