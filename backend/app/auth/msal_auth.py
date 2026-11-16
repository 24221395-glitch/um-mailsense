"""Microsoft sign-in (Siswamail, Outlook, any Microsoft 365 / personal account) via MSAL.

Permissions are read-only: User.Read (who you are) + Mail.Read (read mailbox). MSAL adds
openid/profile/offline_access automatically. Nothing can send, delete or change mail (NFR-02).
"""

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import msal

from app.core.config import get_settings

SCOPES = ["User.Read", "Mail.Read"]

# Microsoft error codes that mean "your university admin must approve this app first".
_ADMIN_APPROVAL_CODES = ("AADSTS65001", "AADSTS90094", "AADSTS90095", "AADSTS900941")


class MicrosoftAuthError(Exception):
    def __init__(self, code: str, detail: str = ""):
        super().__init__(detail or code)
        self.code = code
        self.detail = detail


@dataclass
class TokenResult:
    provider_user_id: str
    email: str
    name: str
    access_token: str
    refresh_token: str | None
    expires_at: datetime


def callback_url() -> str:
    return f"{get_settings().backend_url}/api/v1/auth/microsoft/callback"


def _app() -> msal.ConfidentialClientApplication:
    s = get_settings()
    return msal.ConfidentialClientApplication(
        s.ms_client_id,
        client_credential=s.ms_client_secret,
        authority=f"https://login.microsoftonline.com/{s.ms_tenant}",
    )


def start_flow(login_hint: str | None = None) -> tuple[str, dict]:
    """Returns (url to send the browser to, flow state to keep until the callback)."""
    flow = _app().initiate_auth_code_flow(
        SCOPES, redirect_uri=callback_url(), login_hint=login_hint, prompt="select_account"
    )
    auth_uri = flow.pop("auth_uri")  # not needed later; keeps the state cookie small
    return auth_uri, flow


def _raise_for_error(result: dict) -> None:
    if "error" not in result:
        return
    desc = result.get("error_description", "")
    if any(code in desc for code in _ADMIN_APPROVAL_CODES):
        raise MicrosoftAuthError("admin_approval_required", desc)
    if result.get("error") == "access_denied":
        raise MicrosoftAuthError("access_denied", desc)
    raise MicrosoftAuthError("microsoft_error", f"{result.get('error')}: {desc}")


def _expires(result: dict) -> datetime:
    return datetime.now(UTC) + timedelta(seconds=int(result.get("expires_in", 3600)))


def finish_flow(flow: dict, query_params: dict) -> TokenResult:
    try:
        result = _app().acquire_token_by_auth_code_flow(flow, query_params, scopes=SCOPES)
    except ValueError as exc:  # state mismatch / replay
        raise MicrosoftAuthError("invalid_state", str(exc)) from exc
    _raise_for_error(result)

    claims = result.get("id_token_claims", {})
    email = (claims.get("preferred_username") or claims.get("email") or "").lower()
    if not email:
        raise MicrosoftAuthError("no_email", "Microsoft did not return an email address")
    return TokenResult(
        provider_user_id=f"{claims.get('tid', '')}:{claims.get('oid') or claims.get('sub')}",
        email=email,
        name=claims.get("name", ""),
        access_token=result["access_token"],
        refresh_token=result.get("refresh_token"),
        expires_at=_expires(result),
    )


def refresh(refresh_token: str) -> tuple[str, str | None, datetime]:
    """Returns (access_token, new_refresh_token, expires_at). Raises MicrosoftAuthError."""
    result = _app().acquire_token_by_refresh_token(refresh_token, scopes=SCOPES)
    _raise_for_error(result)
    return result["access_token"], result.get("refresh_token"), _expires(result)
