import mailsense_ai as ai
import pytest
from sqlalchemy import select

from app.graph.mail_sync import sync_user
from app.models import CVProfile, Email
from app.services import ai_bridge
from tests.conftest import fake_email, login_as, make_user

PARSED = ai.CVProfile(
    field_of_study="Computer Science",
    year_of_study=2,
    skills=["Python", "SQL"],
    interests=["Machine learning"],
    summary="Second-year CS student.",
)


@pytest.fixture
def fake_ai(monkeypatch):
    state = {"parse_calls": 0, "parse_error": None, "recommend_calls": 0}

    def parse_cv(data):
        state["parse_calls"] += 1
        if state["parse_error"]:
            raise state["parse_error"]
        return PARSED

    def classify(email):
        seg = "UM_NOTICE" if "Notice" in email.subject else "EVENT"
        return ai.Classification(segment=seg, confidence=0.9)

    def recommend(profile, items):
        state["recommend_calls"] += 1
        state["last_profile"] = profile
        return [
            ai.Recommendation(
                item_id=it.id,
                score=0.9 if "Python" in it.title or it.segment == "UM_NOTICE" else 0.2,
                label="for_you"
                if "Python" in it.title or it.segment == "UM_NOTICE"
                else "not_for_you",
                reason="Matches your skill: Python",
            )
            for it in items
        ]

    monkeypatch.setattr(ai_bridge, "_configured", True)
    monkeypatch.setattr(ai_bridge.ai, "parse_cv", parse_cv)
    monkeypatch.setattr(ai_bridge.ai, "classify_email", classify)
    monkeypatch.setattr(ai_bridge.ai, "extract_details", lambda e: ai.EmailDetails())
    monkeypatch.setattr(ai_bridge.ai, "recommend", recommend)
    return state


def _signed_in_with_sorted_mail(client, db, fake_inbox):
    inbox, _ = fake_inbox
    inbox.extend(
        [
            fake_email(1, subject="Python workshop"),
            fake_email(2, subject="Batik class"),
            fake_email(3, subject="Exam Notice"),
        ]
    )
    user = make_user(db)
    sync_user(db, user)
    ai_bridge.process_pending(db, user)
    login_as(client, user.id)
    return user


def _upload(client, data=b"%PDF-1.4 cv", name="my_cv.pdf"):
    return client.post("/api/v1/profile/cv", files={"file": (name, data, "application/pdf")})


def test_no_profile_yet(client, db):
    login_as(client, make_user(db).id)
    assert client.get("/api/v1/profile").json() is None


def test_upload_cv_creates_profile_and_recommends(client, db, fake_inbox, fake_ai):
    _signed_in_with_sorted_mail(client, db, fake_inbox)
    resp = _upload(client)
    assert resp.status_code == 200
    body = resp.json()
    assert body["skills"] == ["Python", "SQL"] and body["source"] == "cv"
    assert body["cv_filename"] == "my_cv.pdf"

    for_you = client.get("/api/v1/emails?for_you=true").json()["items"]
    assert sorted(e["subject"] for e in for_you) == ["Exam Notice", "Python workshop"]
    assert for_you[0]["recommendation_reason"]


def test_cv_file_is_not_stored(client, db, fake_inbox, fake_ai):
    _signed_in_with_sorted_mail(client, db, fake_inbox)
    _upload(client, data=b"%PDF-1.4 SECRET-CV-CONTENT")
    row = db.scalar(select(CVProfile))
    assert "SECRET-CV-CONTENT" not in str(row.__dict__)


def test_bad_cv_file_gives_422(client, db, fake_ai):
    login_as(client, make_user(db).id)
    fake_ai["parse_error"] = ai.CVParseError("Please upload your CV as a PDF or Word (.docx) file.")
    resp = _upload(client, data=b"GIF89a", name="photo.gif")
    assert resp.status_code == 422 and "PDF or Word" in resp.json()["detail"]


def test_llm_down_during_upload_gives_503(client, db, fake_ai):
    login_as(client, make_user(db).id)
    fake_ai["parse_error"] = ai.LLMError("LLM unreachable")
    assert _upload(client).status_code == 503


def test_too_large_cv(client, db, fake_ai):
    login_as(client, make_user(db).id)
    assert _upload(client, data=b"x" * (5 * 1024 * 1024 + 1)).status_code == 413
    assert fake_ai["parse_calls"] == 0


def test_manual_profile_and_edit_rescores(client, db, fake_inbox, fake_ai):
    _signed_in_with_sorted_mail(client, db, fake_inbox)
    resp = client.put(
        "/api/v1/profile",
        json={"field_of_study": " Law ", "year_of_study": 1, "skills": ["Debate", "debate", " "]},
    )
    assert resp.status_code == 200
    assert resp.json()["skills"] == ["Debate"] and resp.json()["field_of_study"] == "Law"
    assert resp.json()["source"] == "manual"
    assert fake_ai["last_profile"].field_of_study == "Law"
    calls = fake_ai["recommend_calls"]

    client.put("/api/v1/profile", json={"field_of_study": "Medicine", "skills": ["Biology"]})
    assert fake_ai["recommend_calls"] == calls + 1
    assert fake_ai["last_profile"].skills == ["Biology"]


def test_invalid_year_rejected(client, db):
    login_as(client, make_user(db).id)
    assert client.put("/api/v1/profile", json={"year_of_study": 9}).status_code == 422


def test_unsorted_emails_are_not_recommended(client, db, fake_inbox, fake_ai):
    inbox, _ = fake_inbox
    inbox.append(fake_email(1))
    user = make_user(db)
    sync_user(db, user)  # not classified
    login_as(client, user.id)
    client.put("/api/v1/profile", json={"skills": ["Python"]})
    # background AI ran: classification first, then recommendation
    email = db.scalar(select(Email))
    db.refresh(email)
    assert email.segment == "EVENT" and email.recommendation is not None


def test_delete_profile_clears_recommendations(client, db, fake_inbox, fake_ai):
    _signed_in_with_sorted_mail(client, db, fake_inbox)
    _upload(client)
    assert client.delete("/api/v1/profile").status_code == 204
    assert client.get("/api/v1/profile").json() is None
    assert client.get("/api/v1/emails?for_you=true").json()["total"] == 0


def test_delete_account_removes_profile(client, db, fake_inbox, fake_ai):
    _signed_in_with_sorted_mail(client, db, fake_inbox)
    _upload(client)
    client.delete("/api/v1/auth/me")
    db.expire_all()
    assert db.scalar(select(CVProfile)) is None
