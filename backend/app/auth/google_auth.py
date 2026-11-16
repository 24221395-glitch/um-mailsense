"""Google sign-in (Gmail) using the OAuth 2.0 authorization-code flow with PKCE.

Scope gmail.readonly is read-only. While the Google Cloud app is in "Testing" mode, only the
Gmail addresses listed as test users (max 100) can sign in.
"""

import base64
import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from urllib.parse import urlencode

import httpx
import jwt

from app.auth.msal_auth import TokenResult
from app.core.config import get_settings

AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly"
SCOPES = ["openid", "email", "profile", GMAIL_SCOPE]


class GoogleAuthError(Exception):
    def __init__(self, code: str, detail: str = ""):
        super().__init__(detail or code)
        self.code = code
        self.detail = detail


def callback_url() -> str:
    return f"{get_settings().backend_url}/api/v1/auth/google/callback"


def start_flow(login_hint: str | None = None) -> tuple[str, dict]:
    verifier = secrets.token_urlsafe(64)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=")
    flow = {"state": secrets.token_urlsafe(24), "code_verifier": verifier}
    params = {
        "client_id": get_settings().google_client_id,
        "redirect_uri": callback_url(),
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "state": flow["state"],
        "code_challenge": challenge.decode(),
        "code_challenge_method": "S256",
        "access_type": "offline",  # gives a refresh token for background sync
        "prompt": "consent select_account",
        "include_granted_scopes": "true",
    }
    if login_hint:
        params["login_hint"] = login_hint
    return f"{AUTH_URL}?{urlencode(params)}", flow


def _post_token(data: dict) -> dict:
    s = get_settings()
    data = {"client_id": s.google_client_id, "client_secret": s.google_client_secret, **data}
    resp = httpx.post(TOKEN_URL, data=data, timeout=20)
    body = resp.json()
    if resp.status_code != 200:
        err = body.get("error", "google_error")
        if err == "invalid_grant":
            raise GoogleAuthError("reconnect_required", body.get("error_description", ""))
        raise GoogleAuthError("google_error", f"{err}: {body.get('error_description', '')}")
    return body


def finish_flow(flow: dict, query_params: dict) -> TokenResult:
    if query_params.get("error"):
        code = "access_denied" if query_params["error"] == "access_denied" else "google_error"
        raise GoogleAuthError(code, query_params["error"])
    if not secrets.compare_digest(query_params.get("state", ""), flow.get("state", "")):
        raise GoogleAuthError("invalid_state")

    body = _post_token(
        {
            "code": query_params.get("code", ""),
            "grant_type": "authorization_code",
            "redirect_uri": callback_url(),
            "code_verifier": flow["code_verifier"],
        }
    )
    # Google lets people untick individual permissions; we cannot work without Gmail access.
    if GMAIL_SCOPE not in body.get("scope", "").split():
        raise GoogleAuthError("gmail_permission_missing")

    # The ID token came straight from Google's token endpoint over TLS, so the signature
    # check can be skipped (OpenID Connect Core §3.1.3.7).
    claims = jwt.decode(body["id_token"], options={"verify_signature": False})
    if not claims.get("email_verified", False):
        raise GoogleAuthError("email_not_verified")

    return TokenResult(
        provider_user_id=claims["sub"],
        email=claims["email"].lower(),
        name=claims.get("name", ""),
        access_token=body["access_token"],
        refresh_token=body.get("refresh_token"),
        expires_at=datetime.now(UTC) + timedelta(seconds=int(body.get("expires_in", 3600))),
    )


def refresh(refresh_token: str) -> tuple[str, str | None, datetime]:
    body = _post_token({"refresh_token": refresh_token, "grant_type": "refresh_token"})
    expires_at = datetime.now(UTC) + timedelta(seconds=int(body.get("expires_in", 3600)))
    return body["access_token"], body.get("refresh_token"), expires_at
