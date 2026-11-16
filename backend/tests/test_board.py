from datetime import UTC, datetime, timedelta
from urllib.parse import parse_qs, urlparse

import mailsense_ai as ai
import pytest
from sqlalchemy import select

from app.models import Ad, AdRecommendation, CVProfile, Organisation
from app.services import ai_bridge
from tests.conftest import login_as, make_user

SOON = (datetime.now(UTC) + timedelta(days=7)).isoformat()
PAST = (datetime.now(UTC) - timedelta(days=7)).isoformat()


def ad_body(**over):
    body = {
        "title": "UM Hackathon 2026",
        "description": "36-hour hackathon for Python lovers",
        "category": "HACKATHON",
        "event_date": SOON,
        "venue": "FSKTM",
        "link": "https://forms.gle/abc",
    }
    body.update(over)
    return body


@pytest.fixture
def people(db):
    admin = make_user(db, email="admin@um.edu.my")
    admin.role = "admin"
    club = make_user(db, email="club@siswa.um.edu.my")
    student = make_user(db, email="student@siswa.um.edu.my")
    db.commit()
    return {"admin": admin, "club": club, "student": student}


def approved_club(client, people):
    login_as(client, people["club"].id)
    resp = client.post(
        "/api/v1/organisations",
        json={"name": "Robotics Club", "contact_email": "robotics@um.edu.my"},
    )
    assert resp.status_code == 201
    login_as(client, people["admin"].id)
    assert (
        client.post(f"/api/v1/admin/organisations/{resp.json()['id']}/approve").status_code == 200
    )
    login_as(client, people["club"].id)
    return resp.json()["id"]


def post(client, **over) -> int:
    resp = client.post("/api/v1/ads", json=ad_body(**over))
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


# --- organisations -------------------------------------------------------------------------


def test_apply_and_wait_for_approval(client, people):
    login_as(client, people["club"].id)
    assert client.get("/api/v1/organisations/mine").json() is None
    body = {"name": "Robotics Club", "contact_email": "robotics@um.edu.my"}
    assert client.post("/api/v1/organisations", json=body).json()["status"] == "pending"
    assert client.post("/api/v1/organisations", json=body).status_code == 409
    # not approved yet: cannot post
    assert client.post("/api/v1/ads", json=ad_body()).status_code == 403


def test_bad_organisation_input(client, people):
    login_as(client, people["club"].id)
    bad = {"name": "X", "contact_email": "not-an-email"}
    assert client.post("/api/v1/organisations", json=bad).status_code == 422


def test_rejected_then_resubmitted(client, people):
    login_as(client, people["club"].id)
    org_id = client.post(
        "/api/v1/organisations", json={"name": "Club", "contact_email": "c@um.edu.my"}
    ).json()["id"]
    login_as(client, people["admin"].id)
    client.post(f"/api/v1/admin/organisations/{org_id}/reject", json={"note": "Add a website"})
    login_as(client, people["club"].id)
    mine = client.get("/api/v1/organisations/mine").json()
    assert mine["status"] == "rejected" and mine["review_note"] == "Add a website"
    resp = client.put(
        "/api/v1/organisations/mine",
        json={"name": "Club", "contact_email": "c@um.edu.my", "website": "https://club.my"},
    )
    assert resp.json()["status"] == "pending"


# --- admin access --------------------------------------------------------------------------


def test_admin_endpoints_need_admin_role(client, people):
    login_as(client, people["student"].id)
    for path in ("/api/v1/admin/organisations", "/api/v1/admin/ads", "/api/v1/admin/stats"):
        assert client.get(path).status_code == 403


def test_admin_lists_pending_with_owner_and_stats(client, people):
    login_as(client, people["club"].id)
    client.post("/api/v1/organisations", json={"name": "Club", "contact_email": "c@um.edu.my"})
    login_as(client, people["admin"].id)
    pending = client.get("/api/v1/admin/organisations?status=pending").json()
    assert pending[0]["owner_email"] == "club@siswa.um.edu.my"
    stats = client.get("/api/v1/admin/stats").json()
    assert stats["users"] == 3 and stats["organisations_pending"] == 1
    assert stats["llm"] == {"configured": False}


# --- posting and browsing ------------------------------------------------------------------


def test_post_validation(client, people):
    approved_club(client, people)
    assert client.post("/api/v1/ads", json=ad_body(category="UM_NOTICE")).status_code == 422
    assert client.post("/api/v1/ads", json=ad_body(link="javascript:alert(1)")).status_code == 422
    assert client.post("/api/v1/ads", json=ad_body(title="")).status_code == 422


def test_board_filters(client, people):
    approved_club(client, people)
    post(client, title="Hackathon A", faculty="Faculty of Engineering")
    post(client, title="Open talk", category="EVENT")  # all faculties
    post(client, title="Old event", category="EVENT", event_date=PAST)
    post(client, title="Law moot", category="EVENT", faculty="Faculty of Law")

    login_as(client, people["student"].id)
    titles = lambda q: sorted(a["title"] for a in client.get(f"/api/v1/ads{q}").json()["items"])  # noqa: E731
    assert titles("") == ["Hackathon A", "Law moot", "Open talk"]  # past hidden
    assert "Old event" in titles("?include_past=true")
    assert titles("?category=EVENT") == ["Law moot", "Open talk"]
    assert titles("?faculty=Faculty of Engineering") == ["Hackathon A", "Open talk"]
    assert titles("?q=moot") == ["Law moot"]
    assert titles("?q=robotics") == ["Hackathon A", "Law moot", "Open talk"]  # org name


def test_naive_times_are_malaysia_time(client, people):
    approved_club(client, people)
    ad_id = post(client, event_date="2027-01-10T09:00:00")
    login_as(client, people["student"].id)
    assert client.get(f"/api/v1/ads/{ad_id}").json()["event_date"] == "2027-01-10T01:00:00+00:00"


def test_save_and_saved_filter(client, people):
    approved_club(client, people)
    ad_id = post(client)
    post(client, title="Another")
    login_as(client, people["student"].id)
    assert client.post(f"/api/v1/ads/{ad_id}/save").status_code == 204
    assert client.post(f"/api/v1/ads/{ad_id}/save").status_code == 204  # idempotent
    saved = client.get("/api/v1/ads?saved=true").json()["items"]
    assert [a["id"] for a in saved] == [ad_id] and saved[0]["is_saved"] is True
    client.delete(f"/api/v1/ads/{ad_id}/save")
    assert client.get("/api/v1/ads?saved=true").json()["total"] == 0


def test_org_stats_views_and_saves(client, people):
    approved_club(client, people)
    ad_id = post(client)
    client.get(f"/api/v1/ads/{ad_id}")  # owner's own view does not count
    login_as(client, people["student"].id)
    client.get(f"/api/v1/ads/{ad_id}")
    client.get(f"/api/v1/ads/{ad_id}")
    client.post(f"/api/v1/ads/{ad_id}/save")
    login_as(client, people["club"].id)
    mine = client.get("/api/v1/ads/mine").json()[0]
    assert (mine["views"], mine["saves"], mine["open_reports"]) == (2, 1, 0)


def test_only_owner_can_edit_or_delete(client, people, db):
    approved_club(client, people)
    ad_id = post(client)
    other = make_user(db, email="other@siswa.um.edu.my")
    org = Organisation(
        owner_user_id=other.id, name="Other", contact_email="o@um.edu.my", status="approved"
    )
    db.add(org)
    db.commit()
    login_as(client, other.id)
    assert client.put(f"/api/v1/ads/{ad_id}", json=ad_body(title="Hacked")).status_code == 404
    assert client.delete(f"/api/v1/ads/{ad_id}").status_code == 404
    login_as(client, people["club"].id)
    assert client.put(f"/api/v1/ads/{ad_id}", json=ad_body(title="Edited")).status_code == 200
    assert client.delete(f"/api/v1/ads/{ad_id}").status_code == 204


# --- moderation ----------------------------------------------------------------------------


def test_report_then_admin_hides(client, people):
    approved_club(client, people)
    ad_id = post(client)
    login_as(client, people["student"].id)
    assert client.post(f"/api/v1/ads/{ad_id}/reports", json={"reason": "Spam"}).status_code == 201
    assert client.post(f"/api/v1/ads/{ad_id}/reports", json={"reason": "Spam"}).status_code == 409

    login_as(client, people["admin"].id)
    reported = client.get("/api/v1/admin/ads?reported=true").json()
    assert reported[0]["report_reasons"] == ["Spam"]
    hidden = client.patch(f"/api/v1/admin/ads/{ad_id}", json={"status": "hidden"}).json()
    assert hidden["status"] == "hidden" and hidden["open_reports"] == 0

    login_as(client, people["student"].id)
    assert client.get("/api/v1/ads").json()["total"] == 0
    assert client.get(f"/api/v1/ads/{ad_id}").status_code == 404


def test_rejecting_org_takes_its_posts_down(client, people):
    org_id = approved_club(client, people)
    post(client)
    login_as(client, people["admin"].id)
    client.post(f"/api/v1/admin/organisations/{org_id}/reject", json={"note": "Fake club"})
    login_as(client, people["student"].id)
    assert client.get("/api/v1/ads").json()["total"] == 0


def test_require_approval_setting(client, people, monkeypatch):
    monkeypatch.setenv("ADS_REQUIRE_APPROVAL", "true")
    from app.core.config import get_settings

    get_settings.cache_clear()
    approved_club(client, people)
    ad_id = post(client)
    login_as(client, people["student"].id)
    assert client.get("/api/v1/ads").json()["total"] == 0
    login_as(client, people["admin"].id)
    client.patch(f"/api/v1/admin/ads/{ad_id}", json={"status": "approved"})
    login_as(client, people["student"].id)
    assert client.get("/api/v1/ads").json()["total"] == 1


# --- recommendations -----------------------------------------------------------------------


def test_for_you_posts_scored_in_background(client, people, db, monkeypatch):
    calls = []

    def recommend(profile, items):
        calls.append([i.id for i in items])
        return [
            ai.Recommendation(
                item_id=i.id,
                score=0.9 if "Python" in i.text else 0.1,
                label="for_you" if "Python" in i.text else "not_for_you",
                reason="Matches your skill: Python",
            )
            for i in items
        ]

    monkeypatch.setattr(ai_bridge.ai, "recommend", recommend)
    monkeypatch.setattr(ai_bridge, "_configured", True)
    approved_club(client, people)
    py = post(client)
    post(client, title="Batik", description="Painting class", category="EVENT")

    db.add(CVProfile(user_id=people["student"].id, skills=["Python"]))
    db.commit()
    login_as(client, people["student"].id)
    client.get("/api/v1/ads")  # triggers background scoring
    client.get("/api/v1/ads")  # already scored: no new LLM call
    assert len(calls) == 1

    for_you = client.get("/api/v1/ads?for_you=true").json()["items"]
    assert [a["id"] for a in for_you] == [py]
    assert for_you[0]["recommendation_reason"] == "Matches your skill: Python"

    # editing the post forgets old scores
    login_as(client, people["club"].id)
    client.put(f"/api/v1/ads/{py}", json=ad_body(description="Now about Java"))
    assert db.scalar(select(AdRecommendation).where(AdRecommendation.ad_id == py)) is None


def test_deleting_owner_account_removes_org_and_posts(client, people, db):
    approved_club(client, people)
    post(client)
    client.delete("/api/v1/auth/me")
    db.expire_all()
    assert db.scalar(select(Organisation)) is None and db.scalar(select(Ad)) is None


# --- sign-in redirect for clubs ------------------------------------------------------------


@pytest.mark.parametrize(
    "next_, expected",
    [("/organisation", "/organisation"), ("https://evil.example", "/inbox"), ("//evil", "/inbox")],
)
def test_login_next_redirect_is_safe(client, monkeypatch, fake_inbox, next_, expected):
    import httpx
    import jwt

    from app.auth import google_auth

    token = {
        "access_token": "a",
        "refresh_token": "r",
        "expires_in": 3600,
        "scope": f"openid email {google_auth.GMAIL_SCOPE}",
        "id_token": jwt.encode(
            {"sub": "1", "email": "c@gmail.com", "email_verified": True}, "k" * 32
        ),
    }
    monkeypatch.setattr(google_auth.httpx, "post", lambda *a, **k: httpx.Response(200, json=token))
    loc = client.get(f"/api/v1/auth/google/login?next={next_}").headers["location"]
    state = parse_qs(urlparse(loc).query)["state"][0]
    resp = client.get(f"/api/v1/auth/google/callback?code=x&state={state}")
    assert resp.headers["location"] == f"http://localhost:5173{expected}"
