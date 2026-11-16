from datetime import UTC, datetime

import mailsense_ai as ai
import pytest
from sqlalchemy import select

from app.models import Email
from app.services import ai_bridge
from tests.conftest import fake_email, login_as, make_user


@pytest.fixture
def fake_ai(monkeypatch):
    """Replace the LLM calls with scripted answers."""
    state = {"classify_calls": 0, "extract_calls": 0, "segment": "HACKATHON", "fail": None}

    def classify(email):
        state["classify_calls"] += 1
        if state["fail"]:
            raise state["fail"]
        return ai.Classification(segment=state["segment"], confidence=0.9, reason="test")

    def extract(email):
        state["extract_calls"] += 1
        return ai.EmailDetails(
            deadline=datetime(2026, 11, 28, 15, 59, tzinfo=UTC),
            venue="DK1",
            organiser="FSKTM",
            registration_link="https://forms.gle/abc",
        )

    monkeypatch.setattr(ai_bridge.ai, "classify_email", classify)
    monkeypatch.setattr(ai_bridge.ai, "extract_details", extract)
    monkeypatch.setattr(ai_bridge, "_configured", True)
    return state


def _user_with_mail(db, fake_inbox, n=2):
    inbox, _ = fake_inbox
    inbox.extend(fake_email(i) for i in range(1, n + 1))
    user = make_user(db)
    from app.graph.mail_sync import sync_user

    sync_user(db, user)
    return user


def test_sync_endpoint_sorts_mail_in_background(client, db, fake_inbox, fake_ai):
    user = make_user(db)
    fake_inbox[0].append(fake_email(1))
    login_as(client, user.id)
    client.post("/api/v1/emails/sync")  # TestClient runs background tasks before returning

    email = client.get("/api/v1/emails").json()["items"][0]
    assert email["segment"] == "HACKATHON"
    assert email["deadline"] == "2026-11-28T15:59:00+00:00"
    detail = client.get(f"/api/v1/emails/{email['id']}").json()
    assert detail["venue"] == "DK1" and detail["segment_reason"] == "test"


def test_each_email_goes_to_llm_only_once(db, fake_inbox, fake_ai):
    user = _user_with_mail(db, fake_inbox)
    assert ai_bridge.process_pending(db, user) == 2
    assert ai_bridge.process_pending(db, user) == 0
    assert fake_ai["classify_calls"] == 2


def test_not_for_me_skips_extraction(db, fake_inbox, fake_ai):
    fake_ai["segment"] = "NOT_FOR_ME"
    user = _user_with_mail(db, fake_inbox, n=1)
    ai_bridge.process_pending(db, user)
    assert fake_ai["extract_calls"] == 0


def test_manual_segment_is_kept(db, fake_inbox, fake_ai):
    user = _user_with_mail(db, fake_inbox, n=1)
    email = db.scalar(select(Email))
    email.segment, email.segment_is_manual = "CLUB", True
    db.commit()
    ai_bridge.process_pending(db, user)
    db.refresh(email)
    assert email.segment == "CLUB" and email.venue == "DK1"
    assert fake_ai["classify_calls"] == 0


def test_bad_output_counts_attempts_then_gives_up(db, fake_inbox, fake_ai):
    fake_ai["fail"] = ai.LLMError("LLM returned unknown segment 'X'")
    user = _user_with_mail(db, fake_inbox, n=1)
    for _ in range(5):
        ai_bridge.process_pending(db, user)
    assert fake_ai["classify_calls"] == 3  # AI_MAX_ATTEMPTS
    assert db.scalar(select(Email)).segment is None


def test_llm_down_does_not_burn_attempts(db, fake_inbox, fake_ai):
    fake_ai["fail"] = ai.LLMError("LLM unreachable: timeout")
    user = _user_with_mail(db, fake_inbox, n=2)
    ai_bridge.process_pending(db, user)
    assert fake_ai["classify_calls"] == 1  # stops at the first failure
    assert db.scalar(select(Email.ai_attempts).limit(1)) == 0

    fake_ai["fail"] = None  # LLM back
    assert ai_bridge.process_pending(db, user) == 2


def test_budget_exceeded_stops_quietly(db, fake_inbox, fake_ai):
    fake_ai["fail"] = ai.BudgetExceeded("limit")
    user = _user_with_mail(db, fake_inbox, n=2)
    assert ai_bridge.process_pending(db, user) == 0
    assert fake_ai["classify_calls"] == 1


def test_no_api_key_leaves_mail_unsorted(db, fake_inbox, monkeypatch):
    monkeypatch.setattr(ai_bridge, "_configured", False)
    user = _user_with_mail(db, fake_inbox, n=1)
    assert ai_bridge.process_pending(db, user) == 0
    assert db.scalar(select(Email)).segment is None
