from sqlalchemy import select, text

from app.models import Email
from tests.conftest import fake_email, login_as, make_user


def _setup(client, db, fake_inbox, n=3):
    inbox, _ = fake_inbox
    inbox.extend(fake_email(i) for i in range(1, n + 1))
    user = make_user(db)
    login_as(client, user.id)
    assert client.post("/api/v1/emails/sync").json() == {"new_emails": len(inbox)}
    return user


def test_sync_is_idempotent_and_updates_read_state(client, db, fake_inbox):
    inbox, _ = fake_inbox
    _setup(client, db, fake_inbox)
    inbox[0].is_read = True
    assert client.post("/api/v1/emails/sync").json() == {"new_emails": 0}
    first = client.get("/api/v1/emails").json()["items"][0]
    assert first["subject"] == "Subject 1" and first["is_read"] is True


def test_list_newest_first_and_paginated(client, db, fake_inbox):
    _setup(client, db, fake_inbox, n=5)
    page = client.get("/api/v1/emails?page=2&page_size=2").json()
    assert page["total"] == 5
    assert [e["subject"] for e in page["items"]] == ["Subject 3", "Subject 4"]


def test_search(client, db, fake_inbox):
    inbox, _ = fake_inbox
    inbox.append(fake_email(9, subject="Hackathon UM 2026"))
    _setup(client, db, fake_inbox)
    items = client.get("/api/v1/emails?q=hackathon").json()["items"]
    assert [e["subject"] for e in items] == ["Hackathon UM 2026"]


def test_detail_body_is_encrypted_at_rest(client, db, fake_inbox):
    _setup(client, db, fake_inbox, n=1)
    email_id = client.get("/api/v1/emails").json()["items"][0]["id"]
    assert client.get(f"/api/v1/emails/{email_id}").json()["body_text"] == "Full body 1"
    raw = db.execute(text("select body_text from emails")).scalar()
    assert "Full body" not in raw


def test_move_segment_and_counts(client, db, fake_inbox):
    _setup(client, db, fake_inbox)
    ids = [e["id"] for e in client.get("/api/v1/emails").json()["items"]]
    resp = client.patch(f"/api/v1/emails/{ids[0]}", json={"segment": "HACKATHON", "is_read": True})
    assert resp.json()["segment"] == "HACKATHON" and resp.json()["segment_is_manual"] is True

    counts = {c["code"]: c for c in client.get("/api/v1/emails/segment-counts").json()}
    assert counts["HACKATHON"] == {"code": "HACKATHON", "total": 1, "unread": 0}
    assert counts[None] == {"code": None, "total": 2, "unread": 2}

    assert client.get("/api/v1/emails?segment=HACKATHON").json()["total"] == 1
    assert client.get("/api/v1/emails?segment=UNSORTED").json()["total"] == 2


def test_invalid_segment_rejected(client, db, fake_inbox):
    _setup(client, db, fake_inbox, n=1)
    email_id = client.get("/api/v1/emails").json()["items"][0]["id"]
    assert client.patch(f"/api/v1/emails/{email_id}", json={"segment": "SPAM"}).status_code == 422


def test_cannot_see_other_users_email(client, db, fake_inbox):
    _setup(client, db, fake_inbox, n=1)
    email_id = db.scalar(select(Email.id))
    other = make_user(db, email="other@siswa.um.edu.my")
    login_as(client, other.id)
    assert client.get(f"/api/v1/emails/{email_id}").status_code == 404
    assert client.get("/api/v1/emails").json()["total"] == 0
