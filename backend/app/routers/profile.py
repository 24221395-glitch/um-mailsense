"""The student's profile: upload a CV, view and edit it, delete it (FR-20/21/22/26)."""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.graph.mail_sync import process_user_ai
from app.models import CVProfile, User
from app.schemas.profile import ProfileIn, ProfileOut
from app.services import ai_bridge

router = APIRouter(prefix="/api/v1/profile", tags=["profile"])

MAX_CV_BYTES = 5 * 1024 * 1024


def _get(db: Session, user: User) -> CVProfile | None:
    return db.scalar(select(CVProfile).where(CVProfile.user_id == user.id))


def _save(db: Session, user: User, **fields) -> CVProfile:
    row = _get(db, user)
    if row is None:
        row = CVProfile(user_id=user.id)
        db.add(row)
    for key, value in fields.items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    ai_bridge.reset_recommendations(db, user)  # scores depend on the profile
    return row


@router.get("", response_model=ProfileOut | None)
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _get(db, user)


@router.put("", response_model=ProfileOut)
def update_profile(
    body: ProfileIn,
    background: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create or edit the profile by hand (also for students without a CV)."""
    existing = _get(db, user)
    row = _save(
        db,
        user,
        **body.model_dump(),
        source=existing.source if existing else "manual",
        summary=existing.summary if existing else "",
    )
    background.add_task(process_user_ai, user.id)
    return row


@router.post("/cv", response_model=ProfileOut)
async def upload_cv(
    file: UploadFile,
    background: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Read a PDF/DOCX CV in memory, build the profile, and discard the file."""
    data = await file.read(MAX_CV_BYTES + 1)
    if len(data) > MAX_CV_BYTES:
        raise HTTPException(413, "CV must be 5 MB or smaller")
    try:
        parsed = await run_in_threadpool(ai_bridge.parse_cv, data)
    except ai_bridge.ai.CVParseError as exc:
        raise HTTPException(422, str(exc)) from exc
    except ai_bridge.ai.LLMError as exc:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Could not read your CV right now. Please try again in a few minutes, "
            "or fill in your profile by hand.",
        ) from exc
    finally:
        del data

    row = _save(
        db,
        user,
        **parsed.model_dump(),
        source="cv",
        cv_filename=(file.filename or "cv")[:255],
    )
    background.add_task(process_user_ai, user.id)
    return row


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = _get(db, user)
    if row:
        db.delete(row)
        db.commit()
    ai_bridge.reset_recommendations(db, user)
