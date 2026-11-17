from datetime import UTC, datetime, timedelta
from urllib.parse import parse_qs, urlparse

import httpx
import jwt
from sqlalchemy import select, text

from app.auth import google_auth, msal_auth
from app.models import Email, OAuthAccount, User
from tests.conftest import fake_email, login_as, make_user


def _google_token_response(scope=google_auth.GMAIL_SCOPE, email="me@gmail.com", verified=True):
    id_token = jwt.encode(
        {"sub": "g-123", "email": email, "email_verified": verified, "name": "Gmail User"},
        "x" * 32,
    )
    return httpx.Response(
        200,
        json={
            "access_token": "g-access",
            "refresh_token": "g-refresh",
            "expires_in": 3600,
            "scope": f"openid email profile {scope}",
            "id_token": id_token,
        },
    )


def _start_google(client):
    resp = client.get("/api/v1/auth/google/login")
    assert resp.status_code == 302
    url = urlparse(resp.headers["location"])
    return parse_qs(url.query)


# --- general ---------------------------------------------------------------------------


def test_health_and_providers(client):
    assert client.get("/api/v1/health").json() == {"status": "ok"}
    assert client.get("/api/v1/auth/providers").json() == {
        "microsoft": True,
        "google": True,
        "demo": False,
    }


def test_me_requires_login(client):
    assert client.get("/api/v1/auth/me").status_code == 401


def test_unknown_provider(client):
    assert client.get("/api/v1/auth/yahoo/login").status_code == 404


# --- Google ----------------------------------------------------------------------------


def test_google_login_redirect_uses_pkce_and_offline_access(client):
    q = _start_google(client)
    assert q["code_challenge_method"] == ["S256"]
    assert q["access_type"] == ["offline"]
    assert google_auth.GMAIL_SCOPE in q["scope"][0]
    assert q["redirect_uri"] == ["http://localhost:8000/api/v1/auth/google/callback"]
    assert "mailsense_oauth_google" in client.cookies


def test_google_callback_signs_in_and_syncs(client, db, fake_inbox, monkeypatch):
    inbox, _ = fake_inbox
    inbox.extend([fake_email(1), fake_email(2)])
    monkeypatch.setattr(google_auth.httpx, "post", lambda *a, **k: _google_token_response())

    state = _start_google(client)["state"][0]
    resp = client.get(f"/api/v1/auth/google/callback?code=abc&state={state}")

    assert resp.status_code == 302
    assert resp.headers["location"] == "http://localhost:5173/home"
    me = client.get("/api/v1/auth/me").json()
    assert me["email"] == "me@gmail.com"
    assert me["accounts"][0]["provider"] == "google"
    # first sync ran in the background
    assert client.get("/api/v1/emails").json()["total"] == 2
    # tokens are encrypted in the database
    raw = db.execute(text("select access_token, refresh_token from oauth_accounts")).one()
    assert "g-access" not in raw[0] and "g-refresh" not in raw[1]


def test_google_callback_rejects_wrong_state(client):
    _start_google(client)
    resp = client.get("/api/v1/auth/google/callback?code=abc&state=forged")
    assert "error=invalid_state" in resp.headers["location"]


def test_google_callback_without_gmail_permission(client, monkeypatch):
    monkeypatch.setattr(google_auth.httpx, "post", lambda *a, **k: _google_token_response(scope=""))
    state = _start_google(client)["state"][0]
    resp = client.get(f"/api/v1/auth/google/callback?code=abc&state={state}")
    assert "error=gmail_permission_missing" in resp.headers["location"]


def test_callback_without_flow_cookie(client):
    resp = client.get("/api/v1/auth/google/callback?code=abc&state=x")
    assert "error=session_expired" in resp.headers["location"]


def test_domain_restriction(client, monkeypatch, fake_inbox):
    monkeypatch.setenv("ALLOWED_EMAIL_DOMAINS", "siswa.um.edu.my")
    from app.core.config import get_settings

    get_settings.cache_clear()
    monkeypatch.setattr(google_auth.httpx, "post", lambda *a, **k: _google_token_response())
    state = _start_google(client)["state"][0]
    resp = client.get(f"/api/v1/auth/google/callback?code=abc&state={state}")
    assert "error=domain_not_allowed" in resp.headers["location"]


# --- Microsoft -------------------------------------------------------------------------


class FakeMsal:
    def __init__(self, result):
        self.result = result

    def initiate_auth_code_flow(self, scopes, redirect_uri, **kw):
        return {
            "state": "s1",
            "auth_uri": "https://login.microsoftonline.com/x",
            "redirect_uri": redirect_uri,
        }

    def acquire_token_by_auth_code_flow(self, flow, params, scopes):
        return self.result

    def acquire_token_by_refresh_token(self, token, scopes):
        return self.result


def _ms_success():
    return {
        "access_token": "ms-access",
        "refresh_token": "ms-refresh",
        "expires_in": 3600,
        "id_token_claims": {
            "oid": "o1",
            "tid": "t1",
            "preferred_username": "24221395@siswa.um.edu.my",
            "name": "Siswa Student",
        },
    }


def test_microsoft_sign_in(client, monkeypatch, fake_inbox):
    monkeypatch.setattr(msal_auth, "_app", lambda: FakeMsal(_ms_success()))
    assert client.get("/api/v1/auth/microsoft/login").status_code == 302
    resp = client.get("/api/v1/auth/microsoft/callback?code=c&state=s1")
    assert resp.headers["location"].endswith("/home")
    me = client.get("/api/v1/auth/me").json()
    assert me["email"] == "24221395@siswa.um.edu.my"
    assert me["accounts"][0]["provider"] == "microsoft"


def test_microsoft_admin_approval_needed(client, monkeypatch):
    error = {"error": "access_denied", "error_description": "AADSTS65001: needs admin consent"}
    monkeypatch.setattr(msal_auth, "_app", lambda: FakeMsal(error))
    client.get("/api/v1/auth/microsoft/login")
    resp = client.get("/api/v1/auth/microsoft/callback?error=access_denied&state=s1")
    assert "error=admin_approval_required" in resp.headers["location"]


def test_signed_in_user_can_add_second_mailbox(client, db, monkeypatch, fake_inbox):
    user = make_user(db, email="24221395@siswa.um.edu.my", provider="microsoft")
    login_as(client, user.id)
    monkeypatch.setattr(google_auth.httpx, "post", lambda *a, **k: _google_token_response())
    state = _start_google(client)["state"][0]
    client.get(f"/api/v1/auth/google/callback?code=abc&state={state}")

    me = client.get("/api/v1/auth/me").json()
    assert me["id"] == user.id
    assert sorted(a["provider"] for a in me["accounts"]) == ["google", "microsoft"]


def test_admin_role_from_settings(client, monkeypatch, fake_inbox):
    monkeypatch.setenv("ADMIN_EMAILS", "me@gmail.com")
    from app.core.config import get_settings

    get_settings.cache_clear()
    monkeypatch.setattr(google_auth.httpx, "post", lambda *a, **k: _google_token_response())
    state = _start_google(client)["state"][0]
    client.get(f"/api/v1/auth/google/callback?code=abc&state={state}")
    assert client.get("/api/v1/auth/me").json()["role"] == "admin"


# --- sign out / delete -----------------------------------------------------------------


def test_logout(client, db):
    login_as(client, make_user(db).id)
    resp = client.post("/api/v1/auth/logout")
    assert resp.status_code == 204
    cookie = resp.headers["set-cookie"]
    assert cookie.startswith("mailsense_session=") and "Max-Age=0" in cookie


def test_delete_account_removes_everything(client, db, fake_inbox):
    inbox, _ = fake_inbox
    inbox.append(fake_email(1))
    user = make_user(db)
    login_as(client, user.id)
    client.post("/api/v1/emails/sync")

    assert client.delete("/api/v1/auth/me").status_code == 204
    db.expire_all()
    assert db.scalar(select(User)) is None
    assert db.scalar(select(OAuthAccount)) is None
    assert db.scalar(select(Email)) is None


def test_expired_token_is_refreshed_during_sync(client, db, fake_inbox, monkeypatch):
    _, calls = fake_inbox
    user = make_user(db, provider="google", expires_in_min=-5)
    monkeypatch.setitem(
        __import__("app.graph.mail_sync", fromlist=["x"])._REFRESHERS,
        "google",
        lambda rt: ("access-2", None, datetime.now(UTC) + timedelta(hours=1)),
    )
    login_as(client, user.id)
    client.post("/api/v1/emails/sync")
    assert calls == ["access-2"]


def test_revoked_access_marks_mailbox_for_reconnect(client, db, fake_inbox, monkeypatch):
    user = make_user(db, provider="google", expires_in_min=-5)

    def revoked(rt):
        raise google_auth.GoogleAuthError("reconnect_required")

    from app.graph import mail_sync

    monkeypatch.setitem(mail_sync._REFRESHERS, "google", revoked)
    login_as(client, user.id)
    assert client.post("/api/v1/emails/sync").json() == {"new_emails": 0}
    assert client.get("/api/v1/auth/me").json()["accounts"][0]["needs_reconnect"] is True
