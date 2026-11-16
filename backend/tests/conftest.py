import os
import tempfile
from datetime import UTC, datetime, timedelta

import pytest

_tmp = tempfile.mkdtemp()
os.environ.update(
    DATABASE_URL=f"sqlite:///{_tmp}/test.db",
    SYNC_ENABLED="false",
    SECRET_KEY="test-secret-test-secret-test-secret-123",
    MS_CLIENT_ID="ms-id",
    MS_CLIENT_SECRET="ms-secret",
    GOOGLE_CLIENT_ID="g-id",
    GOOGLE_CLIENT_SECRET="g-secret",
    ALLOWED_EMAIL_DOMAINS="",
    ADMIN_EMAILS="",
    LLM_API_KEY="",  # tests never call the real LLM
    # never pick up the developer's backend/.env values
    ENVIRONMENT="development",
    ENCRYPTION_KEY="",
    DEMO_MODE="false",
    SERVERLESS="false",
    CRON_SECRET="",
    ADS_REQUIRE_APPROVAL="false",
    SYNC_INTERVAL_MINUTES="10",
)
os.environ.pop("VERCEL", None)

from fastapi.testclient import TestClient  # noqa: E402

from app.core.config import get_settings  # noqa: E402
from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.graph import mail_sync  # noqa: E402
from app.graph.base import FetchedEmail  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Email, OAuthAccount, User  # noqa: E402


@pytest.fixture(autouse=True)
def fresh_db():
    get_settings.cache_clear()
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield


@pytest.fixture
def client():
    return TestClient(app, follow_redirects=False)


@pytest.fixture
def db():
    with SessionLocal() as session:
        yield session


def fake_email(n: int, **overrides) -> FetchedEmail:
    data = dict(
        provider_message_id=f"msg-{n}",
        sender_name=f"Sender {n}",
        sender_email=f"sender{n}@um.edu.my",
        subject=f"Subject {n}",
        snippet=f"Preview {n}",
        body_text=f"Full body {n}",
        received_at=datetime.now(UTC) - timedelta(hours=n),
        is_read=False,
        web_link=None,
    )
    data.update(overrides)
    return FetchedEmail(**data)


@pytest.fixture
def fake_inbox(monkeypatch):
    """Replace both mail providers with an in-memory inbox."""
    inbox: list[FetchedEmail] = []
    calls: list[str] = []

    def fetch(token, since, limit):
        calls.append(token)
        return list(inbox)

    monkeypatch.setitem(mail_sync._FETCHERS, "microsoft", fetch)
    monkeypatch.setitem(mail_sync._FETCHERS, "google", fetch)
    return inbox, calls


def make_user(db, email="student@siswa.um.edu.my", provider="google", expires_in_min=60) -> User:
    user = User(email=email, name="Test Student")
    db.add(user)
    db.flush()
    db.add(
        OAuthAccount(
            user_id=user.id,
            provider=provider,
            provider_user_id=f"pid-{email}",
            email=email,
            access_token="access-1",
            refresh_token="refresh-1",
            expires_at=datetime.now(UTC) + timedelta(minutes=expires_in_min),
        )
    )
    db.commit()
    return user


def login_as(client, user_id: int):
    from app.core.security import SESSION_COOKIE, create_session_token

    client.cookies.set(SESSION_COOKIE, create_session_token(user_id))


__all__ = ["Email", "fake_email", "login_as", "make_user"]
