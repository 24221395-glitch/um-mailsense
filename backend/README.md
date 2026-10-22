# backend/ · owner: Raihan

Create these files (FastAPI + PostgreSQL):

```
backend/
├── requirements.txt
├── app/
│   ├── main.py
│   ├── core/          config.py, database.py, security.py
│   ├── auth/          msal_auth.py                 W2-BE-02
│   ├── graph/         graph_client.py, mail_sync.py  W2-BE-03
│   ├── models/        user.py, email.py, organisation.py, ad.py, cv_profile.py, recommendation.py   W2-BE-01
│   ├── schemas/
│   ├── routers/       auth.py, emails.py, ads.py, profile.py, admin.py   W3-BE-01..03
│   └── services/
│       └── ai_bridge.py   SHARED with Iqbal · the only file that imports mailsense_ai
├── migrations/        Alembic
└── tests/
```

Also yours at the repo root: `docker-compose.yml`, `.env.example` (SHARED with Iqbal), `.github/workflows/ci.yml` (W1-BE-02).
API paths start with `/api/v1/`. Database tables are snake_case plural.
