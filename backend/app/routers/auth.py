"""Siswamail sign-in routes (W2-BE-02, due 2 Nov). Owner: Raihan."""

from fastapi import APIRouter, Depends, status
from fastapi.responses import RedirectResponse

from app.core.security import get_current_user_id
from app.routers import not_built
from app.schemas.user import UserOut

router = APIRouter(tags=["auth"])


@router.get("/auth/login", response_class=RedirectResponse, status_code=status.HTTP_302_FOUND)
def login():
    raise not_built("W2-BE-02")


@router.get("/auth/callback", response_class=RedirectResponse, status_code=status.HTTP_302_FOUND)
def callback(code: str, state: str | None = None):
    raise not_built("W2-BE-02")


@router.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout():
    raise not_built("W2-BE-02")


@router.get("/me", response_model=UserOut)
def me(user_id: str = Depends(get_current_user_id)):
    raise not_built("W2-BE-02")


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(user_id: str = Depends(get_current_user_id)):
    """Disconnect Siswamail and delete all of this student's data (NFR-01)."""
    raise not_built("W2-BE-02")
