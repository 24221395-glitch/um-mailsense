"""Smoke tests that need no database."""

from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_health():
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_protected_routes_need_sign_in():
    assert client.get("/api/v1/emails").status_code == 401


def test_contract_routes_exist():
    """Every route in docs/04-api-contract.md is registered (body may still be 501)."""
    paths = app.openapi()["paths"]
    expected = {
        "/api/v1/health": {"get"},
        "/api/v1/auth/login": {"get"},
        "/api/v1/auth/callback": {"get"},
        "/api/v1/auth/logout": {"post"},
        "/api/v1/me": {"get", "delete"},
        "/api/v1/segments": {"get"},
        "/api/v1/emails": {"get"},
        "/api/v1/emails/{email_id}": {"get", "patch"},
        "/api/v1/emails/sync": {"post"},
        "/api/v1/ads": {"get", "post"},
        "/api/v1/ads/{ad_id}": {"get"},
        "/api/v1/ads/{ad_id}/save": {"post", "delete"},
        "/api/v1/me/saved-ads": {"get"},
        "/api/v1/organisations": {"post"},
        "/api/v1/organisations/me": {"get"},
        "/api/v1/me/profile": {"get", "patch"},
        "/api/v1/me/cv": {"post"},
        "/api/v1/me/recommendations": {"get"},
        "/api/v1/me/deadlines": {"get"},
        "/api/v1/admin/organisations": {"get"},
        "/api/v1/admin/organisations/{org_id}/approve": {"post"},
        "/api/v1/admin/organisations/{org_id}/reject": {"post"},
        "/api/v1/admin/ads": {"get"},
        "/api/v1/admin/ads/{ad_id}/approve": {"post"},
        "/api/v1/admin/ads/{ad_id}": {"delete"},
        "/api/v1/admin/stats": {"get"},
    }
    for path, methods in expected.items():
        assert path in paths, path
        assert methods <= set(paths[path]), path


def test_segment_enum_matches_contract():
    schema = app.openapi()["components"]["schemas"]["Segment"]
    assert schema["enum"] == [
        "UM_NOTICE",
        "HACKATHON",
        "RESEARCH",
        "EVENT",
        "SCHOLARSHIP_CAREER",
        "CLUB",
        "NOT_FOR_ME",
    ]
