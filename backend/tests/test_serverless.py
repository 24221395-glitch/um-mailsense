import mailsense_ai as ai
import pytest

from app.core.config import Settings, get_settings
from app.models import Ad, CVProfile, Organisation
from app.services import ai_bridge
from tests.conftest import fake_email, login_as, make_user


@pytest.fixture
def serverless(monkeypatch):
    monkeypatch.setenv("VERCEL", "1")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def fake_ai(monkeypatch):
    calls = {"classify": 0, "recommend": 0}

    def classify(email):
        calls["classify"] += 1
        return ai.Classification(segment="EVENT", confidence=0.9)

    def recommend(profile, items):
        calls["recommend"] += 1
        return [
            ai.Recommendation(item_id=i.id, score=0.9, label="for_you", reason="x") for i in items
        ]

    monkeypatch.setattr(ai_bridge, "_configured", True)
    monkeypatch.setattr(ai_bridge.ai, "classify_email", classify)
    monkeypatch.setattr(ai_bridge.ai, "extract_details", lambda e: ai.EmailDetails())
    monkeypatch.setattr(ai_bridge.ai, "recommend", recommend)
    return calls


def test_postgres_urls_get_the_psycopg_driver():
    url = "postgresql://u:p@ep-1.neon.tech/db?sslmode=require"
    assert Settings(database_url=url).database_url.startswith("postgresql+psycopg://")
    assert (
        Settings(database_url="postgres://u:p@h/db").database_url == "postgresql+psycopg://u:p@h/db"
    )
    assert Settings(database_url="sqlite:///x.db").database_url == "sqlite:///x.db"


def test_serverless_detected_from_vercel(serverless):
    assert get_settings().is_serverless is True


def test_sync_if_stale_only_syncs_when_due(client, db, fake_inbox, serverless):
    inbox, calls = fake_inbox
    inbox.append(fake_email(1))
    login_as(client, make_user(db).id)
    assert client.post("/api/v1/emails/sync?if_stale=true").json() == {"new_emails": 1}
    # synced moments ago: the inbox opening again does not hit the mail provider
    assert client.post("/api/v1/emails/sync?if_stale=true").json() == {"new_emails": 0}
    assert len(calls) == 1
    # an explicit refresh always syncs
    client.post("/api/v1/emails/sync")
    assert len(calls) == 2


def test_no_background_ai_on_serverless_then_process_in_batches(
    client, db, fake_inbox, fake_ai, serverless
):
    inbox, _ = fake_inbox
    inbox.extend(fake_email(i) for i in range(1, 6))
    user = make_user(db)
    db.add(CVProfile(user_id=user.id, skills=["Python"]))
    db.commit()
    login_as(client, user.id)
    client.post("/api/v1/emails/sync")
    assert fake_ai["classify"] == 0  # nothing ran after the response

    first = client.post("/api/v1/emails/process?batch=2").json()
    assert first == {"processed": 2, "unsorted": 3, "unscored": 0, "ai_ready": True}
    while client.post("/api/v1/emails/process?batch=2").json()["unsorted"]:
        pass
    final = client.post("/api/v1/emails/process").json()
    assert final["unsorted"] == 0 and final["unscored"] == 0
    assert fake_ai["classify"] == 5
    assert client.get("/api/v1/emails?for_you=true").json()["total"] == 5


def test_process_reports_when_ai_is_not_configured(client, db, monkeypatch):
    monkeypatch.setattr(ai_bridge, "_configured", False)
    login_as(client, make_user(db).id)
    assert client.post("/api/v1/emails/process").json()["ai_ready"] is False


def test_score_ads_on_demand(client, db, fake_ai, serverless):
    user = make_user(db)
    db.add(CVProfile(user_id=user.id, skills=["Python"]))
    owner = make_user(db, email="club@siswa.um.edu.my")
    org = Organisation(
        owner_user_id=owner.id, name="Club", contact_email="c@um.edu.my", status="approved"
    )
    db.add(org)
    db.flush()
    live = Ad(organisation_id=org.id, title="Live", category="EVENT", status="approved")
    hidden = Ad(organisation_id=org.id, title="Hidden", category="EVENT", status="hidden")
    db.add_all([live, hidden])
    db.commit()
    login_as(client, user.id)

    client.get("/api/v1/ads")  # serverless: listing does not score in the background
    assert fake_ai["recommend"] == 0
    resp = client.post("/api/v1/ads/score", json={"ad_ids": [live.id, hidden.id]})
    assert resp.json() == {"scored": 1}
    assert client.get("/api/v1/ads").json()["items"][0]["recommendation"] == "for_you"


def test_cron_requires_the_secret(client, db, fake_inbox, monkeypatch):
    assert client.get("/api/v1/cron/sync").status_code == 404  # no secret configured
    monkeypatch.setenv("CRON_SECRET", "s3cret-value")
    get_settings.cache_clear()
    assert client.get("/api/v1/cron/sync").status_code == 401
    wrong = {"Authorization": "Bearer nope"}
    assert client.get("/api/v1/cron/sync", headers=wrong).status_code == 401

    inbox, _ = fake_inbox
    inbox.append(fake_email(1))
    make_user(db)
    make_user(db, email="b@siswa.um.edu.my")
    ok = client.get("/api/v1/cron/sync", headers={"Authorization": "Bearer s3cret-value"})
    assert ok.json() == {"users": 2, "synced": 2}
