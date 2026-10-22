"""First API smoke tests (W2-QA-02). Add one file per area, e.g. test_emails_api.py."""


def test_health(client):
    assert client.get("/api/v1/health").json() == {"status": "ok"}


def test_inbox_requires_sign_in(client):
    assert client.get("/api/v1/emails").status_code == 401


def test_admin_requires_sign_in(client):
    assert client.get("/api/v1/admin/stats").status_code == 401
