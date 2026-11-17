import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.core.config import get_settings
from app.main import app
from app.models import Email, User


@pytest.fixture
def demo_on(monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "true")
    get_settings.cache_clear()


def test_demo_is_off_by_default(client):
    assert client.get("/api/v1/auth/providers").json()["demo"] is False
    assert client.get("/api/v1/auth/demo/login").status_code == 404


def test_demo_login_creates_sample_data_once(client, db, demo_on):
    assert client.get("/api/v1/auth/providers").json()["demo"] is True
    resp = client.get("/api/v1/auth/demo/login")
    assert resp.status_code == 302 and resp.headers["location"].endswith("/home")
    me = client.get("/api/v1/auth/me").json()
    assert me["email"] == "demo.student@mailsense.local" and me["role"] == "admin"
    assert client.get("/api/v1/emails").json()["total"] == 9
    assert client.get("/api/v1/ads").json()["total"] == 3
    assert client.get("/api/v1/profile").json()["skills"][0] == "Python"
    # demo mailbox is skipped by sync, and logging in again adds nothing
    assert client.post("/api/v1/emails/sync").json() == {"new_emails": 0}
    client.get("/api/v1/auth/demo/login")
    assert db.scalar(select(func.count(Email.id))) == 9
    assert db.scalar(select(func.count(User.id))) == 2


def test_demo_refused_in_production(client, monkeypatch, demo_on):
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("ENCRYPTION_KEY", "x" * 44)
    monkeypatch.setenv("SECRET_KEY", "p" * 40)
    get_settings.cache_clear()
    assert client.get("/api/v1/auth/demo/login").status_code == 404
    with pytest.raises(RuntimeError, match="DEMO_MODE"):
        with TestClient(app):
            pass
