# backend/ (owner: Raihan)

FastAPI + SQLAlchemy 2 + Alembic + PostgreSQL. Interactive API docs at http://localhost:8000/docs.

| Path | Task | Due |
|---|---|---|
| project set-up, CI, docker-compose | W1-BE-02 | 26 Oct |
| `app/models/`, `migrations/` | W2-BE-01 | 31 Oct |
| `app/auth/msal_auth.py`, `app/routers/auth.py` | W2-BE-02 | 2 Nov |
| `app/graph/mail_sync.py` | W2-BE-03 | 4 Nov |
| `app/routers/emails.py` | W3-BE-01 | 6 Nov |
| `app/routers/ads.py` | W3-BE-02 | 8 Nov |
| `app/routers/admin.py` | W3-BE-03 | 9 Nov |
| `app/services/ai_bridge.py` (SHARED with Iqbal) | W3-AI-03 | 10 Nov |
| deploy | W4-BE-02 | 17 Nov |

Every route already exists with the request and response shapes from `docs/04-api-contract.md`,
so the frontend and OpenAPI file are correct from day one. Unbuilt routes answer `501` and name
their task ID. Replace each `not_built(...)` as you build it.

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt     # also installs ../ai in editable mode
docker compose up -d db                  # from the repo root
alembic upgrade head
uvicorn app.main:app --reload
pytest -q
make openapi                             # regenerate backend/openapi.json after changing routes
```
