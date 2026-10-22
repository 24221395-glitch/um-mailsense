# backend/ · owner: Raihan (Backend + DevOps)

Create these files (Python 3.11 · FastAPI · SQLAlchemy · Alembic · PostgreSQL). Task IDs are from the Project Hub.

```
backend/
├── requirements.txt                 W1-BE-02
├── openapi.json                     generated from FastAPI · never edit by hand
├── app/
│   ├── main.py                      W1-BE-02
│   ├── core/       config.py, database.py, security.py
│   ├── auth/       msal_auth.py                       W2-BE-02 (Siswamail sign-in)
│   ├── graph/      graph_client.py, mail_sync.py      W2-BE-03 (inbox sync every 10 min)
│   ├── models/     user.py, email.py, organisation.py, ad.py, cv_profile.py, recommendation.py   W2-BE-01
│   ├── schemas/
│   ├── routers/
│   │   ├── auth.py                  W2-BE-02
│   │   ├── emails.py                W3-BE-01
│   │   ├── ads.py                   W3-BE-02
│   │   ├── profile.py               W3-AI-03 (with Iqbal)
│   │   └── admin.py                 W3-BE-03
│   └── services/
│       └── ai_bridge.py             SHARED with Iqbal · the only file that imports mailsense_ai · W3-AI-03
├── migrations/                      Alembic · W2-BE-01
└── tests/
```

## Also yours, at the repo root
| File | Task |
|---|---|
| `docker-compose.yml` | W1-BE-02 |
| `.env.example` (SHARED with Iqbal: variable names only, never values) | W1-BE-02 |
| `.pre-commit-config.yaml` (Black + Ruff for Python, Prettier for frontend) | W1-BE-02 |
| `.github/workflows/ci.yml` (lint + tests on every pull request) | W1-BE-02 |

## Other tasks
- W1-BE-01 register the app in Microsoft Entra; give Iqbal the permission list for `docs/um-it-request.md`
- W1-BE-03 API contract in `docs/04-api-contract.md` (with Wendi and Iqbal) · freeze 28 Oct
- W3-FE-03 connect the frontend to the real API (with Wendi)
- W4-QA-02 security checks (with QA) · W4-BE-01 bug fixes · W4-BE-02 deploy over HTTPS (with Wendi)

Rules: API paths start with `/api/v1/` (plural kebab-case). Database tables snake_case plural.
