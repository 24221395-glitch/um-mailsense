"""Sign in with Siswamail/Microsoft or Google, sign out, and delete account.

Flow: /auth/{provider}/login → provider sign-in page → /auth/{provider}/callback → back to the
frontend with a session cookie. If the user is already signed in, the callback *adds* that
mailbox to their account (so one person can connect both Siswamail and Gmail).
"""

import logging
from urllib.parse import urlencode

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import google_auth, msal_auth
from app.auth.msal_auth import TokenResult
from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import (
    SESSION_COOKIE,
    clear_session_cookie,
    decrypt_json,
    encrypt_json,
    get_current_user,
    read_session_token,
    set_cookie,
    set_session_cookie,
)
from app.graph.mail_sync import sync_user_by_id
from app.models import OAuthAccount, User
from app.schemas.auth import ProvidersOut, UserOut

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

_PROVIDERS = {"microsoft": msal_auth, "google": google_auth}
_FLOW_COOKIE = "mailsense_oauth_{}"
_AUTH_ERRORS = (msal_auth.MicrosoftAuthError, google_auth.GoogleAuthError)


def _module(provider: str):
    if provider not in _PROVIDERS:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unknown provider")
    configured = {
        "microsoft": get_settings().ms_configured,
        "google": get_settings().google_configured,
    }[provider]
    if not configured:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, f"{provider} sign-in is not set up"
        )
    return _PROVIDERS[provider]


def _to_frontend(path: str, **params) -> RedirectResponse:
    query = f"?{urlencode(params)}" if params else ""
    return RedirectResponse(f"{get_settings().frontend_url}{path}{query}", status.HTTP_302_FOUND)


@router.get("/providers", response_model=ProvidersOut)
def providers():
    """Which sign-in buttons the frontend should show."""
    s = get_settings()
    return ProvidersOut(
        microsoft=s.ms_configured,
        google=s.google_configured,
        demo=s.demo_mode and not s.is_production,
    )


@router.get("/demo/login")
def demo_login(db: Session = Depends(get_db)):
    """Sign in as the demo student (DEMO_MODE=true on a non-production server only)."""
    s = get_settings()
    if not s.demo_mode or s.is_production:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    from app.services.demo_data import ensure_demo_user

    user = ensure_demo_user(db)
    response = _to_frontend("/inbox")
    set_session_cookie(response, user.id)
    return response


def _safe_next(path: str | None) -> str:
    """Only allow redirects to our own frontend pages (no open redirect)."""
    allowed = ("/inbox", "/organisation", "/profile", "/board")
    return path if path in allowed else "/inbox"


@router.get("/{provider}/login")
def login(provider: str, login_hint: str | None = None, next: str | None = None):
    module = _module(provider)
    url, flow = module.start_flow(login_hint)
    response = RedirectResponse(url, status.HTTP_302_FOUND)
    state = encrypt_json({"flow": flow, "next": _safe_next(next)})
    set_cookie(response, _FLOW_COOKIE.format(provider), state, max_age=600)
    return response


def _domain_allowed(email: str) -> bool:
    allowed = get_settings().allowed_domains
    return not allowed or email.rsplit("@", 1)[-1] in allowed


def _save_account(
    db: Session, provider: str, result: TokenResult, current_user_id: int | None
) -> User:
    account = db.scalar(
        select(OAuthAccount).where(
            OAuthAccount.provider == provider,
            OAuthAccount.provider_user_id == result.provider_user_id,
        )
    )
    if account:
        user = account.user
    else:
        user = db.get(User, current_user_id) if current_user_id else None
        if user is None:
            user = db.scalar(select(User).where(User.email == result.email))
        if user is None:
            user = User(email=result.email, name=result.name)
            db.add(user)
            db.flush()
        account = OAuthAccount(
            user_id=user.id, provider=provider, provider_user_id=result.provider_user_id
        )
        db.add(account)

    account.email = result.email
    account.access_token = result.access_token
    if result.refresh_token:  # providers don't always resend it
        account.refresh_token = result.refresh_token
    account.expires_at = result.expires_at
    account.needs_reconnect = False
    if not user.name and result.name:
        user.name = result.name
    if user.email in get_settings().admins:
        user.role = "admin"
    db.commit()
    return user


@router.get("/{provider}/callback")
def callback(
    provider: str, request: Request, background: BackgroundTasks, db: Session = Depends(get_db)
):
    module = _module(provider)
    cookie_name = _FLOW_COOKIE.format(provider)
    raw_flow = request.cookies.get(cookie_name)
    if not raw_flow:
        return _to_frontend("/", error="session_expired")

    try:
        saved = decrypt_json(raw_flow)
        result = module.finish_flow(saved["flow"], dict(request.query_params))
    except _AUTH_ERRORS as exc:
        log.info("%s sign-in failed: %s %s", provider, exc.code, exc.detail)
        response = _to_frontend("/", error=exc.code, provider=provider)
        response.delete_cookie(cookie_name, path="/")
        return response

    if not _domain_allowed(result.email):
        return _to_frontend("/", error="domain_not_allowed", provider=provider)

    session = request.cookies.get(SESSION_COOKIE)
    current_user_id = read_session_token(session) if session else None
    user = _save_account(db, provider, result, current_user_id)

    background.add_task(sync_user_by_id, user.id)  # first inbox pull right away
    response = _to_frontend(_safe_next(saved.get("next")))
    response.delete_cookie(cookie_name, path="/")
    set_session_cookie(response, user.id)
    return response


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response):
    clear_session_cookie(response)


@router.delete("/accounts/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def disconnect_mailbox(
    account_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Disconnect one mailbox and delete its stored emails (FR-05)."""
    account = db.get(OAuthAccount, account_id)
    if not account or account.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Mailbox not found")
    db.delete(account)
    db.commit()


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    response: Response, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Delete the user and all their data immediately (FR-05, NFR-05)."""
    db.delete(user)
    db.commit()
    clear_session_cookie(response)
