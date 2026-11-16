from datetime import UTC, datetime, timedelta

import mailsense_ai as ai
import pytest
from sqlalchemy import select

from app.graph.mail_sync import sync_user
from app.models import Ad, AdSave, Email, Organisation
from app.services import ai_bridge
from tests.conftest import fake_email, login_as, make_user

NOW = datetime.now(UTC)


def _email(db, user, n, **fields):
    account_id = user.accounts[0].id
    e = Email(
        user_id=user.id,
        account_id=account_id,
        provider_message_id=f"m{n}",
        subject=f"Email {n}",
        sender_name="Sender",
        received_at=NOW,
        **fields,
    )
    db.add(e)
    db.commit()
    return e


def _saved_ad(db, user, **fields):
    owner = make_user(db, email=f"club{fields.get('title', '')}@siswa.um.edu.my")
    org = Organisation(
        owner_user_id=owner.id, name="Robotics Club", contact_email="r@um.edu.my", status="approved"
    )
    db.add(org)
    db.flush()
    ad = Ad(organisation_id=org.id, category="EVENT", status="approved", **fields)
    db.add(ad)
    db.flush()
    db.add(AdSave(user_id=user.id, ad_id=ad.id))
    db.commit()
    return ad


# --- deadlines -----------------------------------------------------------------------------


def test_calendar_merges_emails_and_saved_posts(client, db):
    user = make_user(db)
    _email(
        db,
        user,
        1,
        segment="HACKATHON",
        deadline=NOW + timedelta(days=3),
        event_date=NOW + timedelta(days=10),
        registration_link="https://forms.gle/x",
    )
    _email(db, user, 2, segment="NOT_FOR_ME", deadline=NOW + timedelta(days=2))  # hidden
    _email(db, user, 3, segment="EVENT", deadline=NOW + timedelta(days=200))  # out of range
    _saved_ad(db, user, title="Robot Wars", event_date=NOW + timedelta(days=5))
    login_as(client, user.id)

    items = client.get("/api/v1/deadlines").json()
    assert [(i["kind"], i["title"], i["date_type"]) for i in items] == [
        ("email", "Email 1", "deadline"),
        ("ad", "Robot Wars", "event"),
        ("email", "Email 1", "event"),
    ]
    assert items[0]["link"] == "https://forms.gle/x"
    assert items[1]["source"] == "Robotics Club"


def test_calendar_custom_range_and_validation(client, db):
    user = make_user(db)
    _email(db, user, 1, segment="EVENT", deadline=NOW + timedelta(days=200))
    login_as(client, user.id)
    to = (NOW + timedelta(days=365)).isoformat().replace("+00:00", "Z")
    assert len(client.get(f"/api/v1/deadlines?date_to={to}").json()) == 1
    frm = (NOW + timedelta(days=5)).isoformat().replace("+00:00", "Z")
    back = NOW.isoformat().replace("+00:00", "Z")
    assert client.get(f"/api/v1/deadlines?date_from={frm}&date_to={back}").status_code == 422


def test_calendar_is_private(client, db):
    owner = make_user(db)
    _email(db, owner, 1, segment="EVENT", deadline=NOW + timedelta(days=1))
    other = make_user(db, email="other@siswa.um.edu.my")
    login_as(client, other.id)
    assert client.get("/api/v1/deadlines").json() == []


# --- notification settings -----------------------------------------------------------------


def test_notification_settings_round_trip(client, db):
    login_as(client, make_user(db).id)
    assert client.get("/api/v1/notification-settings").json() == {
        "enabled": True,
        "muted_segments": [],
    }
    body = {"enabled": False, "muted_segments": ["CLUB", "EVENT", "CLUB"]}
    assert client.put("/api/v1/notification-settings", json=body).json() == {
        "enabled": False,
        "muted_segments": ["CLUB", "EVENT"],
    }
    assert client.get("/api/v1/notification-settings").json()["enabled"] is False
    bad = {"enabled": True, "muted_segments": ["SPAM"]}
    assert client.put("/api/v1/notification-settings", json=bad).status_code == 422


# --- feedback loop -------------------------------------------------------------------------


@pytest.fixture
def counting_ai(monkeypatch):
    calls = {"classify": 0}

    def classify(email):
        calls["classify"] += 1
        return ai.Classification(segment="EVENT", confidence=0.8)

    monkeypatch.setattr(ai_bridge, "_configured", True)
    monkeypatch.setattr(ai_bridge.ai, "classify_email", classify)
    monkeypatch.setattr(ai_bridge.ai, "extract_details", lambda e: ai.EmailDetails())
    return calls


def test_moving_an_email_teaches_future_sorting(client, db, fake_inbox, counting_ai):
    inbox, _ = fake_inbox
    inbox.append(fake_email(1, sender_email="robotics@gmail.com"))
    user = make_user(db)
    sync_user(db, user)
    ai_bridge.process_pending(db, user)
    login_as(client, user.id)
    first = db.scalar(select(Email))
    resp = client.patch(f"/api/v1/emails/{first.id}", json={"segment": "CLUB"})
    assert resp.json()["segment_reason"] == "Moved by you"

    inbox.append(fake_email(2, sender_email="robotics@gmail.com"))
    inbox.append(fake_email(3, sender_email="someone@else.com"))
    sync_user(db, user)
    ai_bridge.process_pending(db, user)

    new = {e.sender_email: e for e in db.scalars(select(Email).where(Email.id != first.id))}
    assert new["robotics@gmail.com"].segment == "CLUB"
    assert new["robotics@gmail.com"].segment_is_manual is False
    assert new["someone@else.com"].segment == "EVENT"
    assert counting_ai["classify"] == 2  # first email + the unknown sender only


def test_um_staff_mail_is_not_auto_hidden(client, db, fake_inbox, counting_ai):
    inbox, _ = fake_inbox
    inbox.append(fake_email(1, sender_email="registrar@um.edu.my"))
    user = make_user(db)
    sync_user(db, user)
    ai_bridge.process_pending(db, user)
    login_as(client, user.id)
    client.patch(f"/api/v1/emails/{db.scalar(select(Email.id))}", json={"segment": "NOT_FOR_ME"})

    inbox.append(fake_email(2, sender_email="registrar@um.edu.my"))
    sync_user(db, user)
    ai_bridge.process_pending(db, user)
    assert counting_ai["classify"] == 2  # second email went to the AI, not the rule


def test_moving_resets_recommendation(client, db, fake_inbox, counting_ai):
    inbox, _ = fake_inbox
    inbox.append(fake_email(1))
    user = make_user(db)
    sync_user(db, user)
    email = db.scalar(select(Email))
    email.recommendation, email.recommendation_score = "not_for_you", 0.1
    db.commit()
    login_as(client, user.id)
    client.patch(f"/api/v1/emails/{email.id}", json={"segment": "UM_NOTICE"})
    db.refresh(email)
    assert email.recommendation is None  # no profile, so nothing re-scored it
