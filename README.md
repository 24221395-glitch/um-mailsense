# UM MailSense

AI-powered Siswamail organiser and opportunity recommender for Universiti Malaya students.
Students sign in with Siswamail, see their real inbox sorted into segments by an LLM, and get
hackathons, research posts and events recommended from their CV.

**Project window:** 22 Oct – 18 Nov 2026 · **Launch:** 18 Nov 2026

## Team and folders

Every folder has exactly one owner. Write code only inside your own folder.
Rules, roadmap and weekly tasks live in the **UM MailSense Project Hub**.

| Member | Role | Owns | Branch prefix |
|---|---|---|---|
| Bari Iqbal Ibn Abdul (24221395) | Project Manager · AI / LLM Lead | `ai/`, `README.md`, `.github/` (templates, CODEOWNERS) | `ai/`, `pm/` |
| Nazifa Tunazzina Ahamed (25072208) | System Analyst | `docs/` | `docs/` |
| Luo Wendi (24231632) | UI/UX Designer · Frontend | `design/`, `frontend/` | `fe/` |
| Raihan Quddus Tamir (24215489) | Backend · DevOps | `backend/`, `docker-compose.yml`, `.github/workflows/`, `.env.example` | `be/` |
| QA Tester (name to add) | QA Tester | `qa/`, `.github/ISSUE_TEMPLATE/` | `qa/` |

### Shared contracts (change only on a `contract/` branch, every owner approves)

| File | Owners | Freeze |
|---|---|---|
| `ai/mailsense_ai/contracts.py` | Iqbal + Raihan | 28 Oct |
| `backend/app/services/ai_bridge.py` | Raihan + Iqbal | 4 Nov |
| `docs/03-database.md` | Nazifa + Raihan | 28 Oct |
| `docs/04-api-contract.md` | Raihan + Wendi + Iqbal | 28 Oct |
| `.env.example` | Raihan + Iqbal | Open |

Never hand-edit generated files: `frontend/src/types/api.generated.ts` (from Week 2) and `backend/openapi.json`.

## Stack

| Part | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS + React Router |
| Backend | Python 3.11 + FastAPI + SQLAlchemy 2 + Alembic + PostgreSQL 16 |
| Sign-in and mail | Microsoft Entra ID (MSAL) + Microsoft Graph (`User.Read`, `Mail.Read`, `offline_access`) |
| AI | Python package `mailsense_ai` in `ai/`, called by the backend only through `ai_bridge.py` |
| Tests | pytest (backend, ai, qa/api) · Playwright (qa/e2e) |

## Day-one setup

```bash
git clone https://github.com/24221395-glitch/um-mailsense.git
cd um-mailsense
git checkout develop

pip install pre-commit && pre-commit install   # auto-formatting on every commit
cp .env.example .env                           # never commit .env

# Database
docker compose up -d db

# Backend (http://localhost:8000/docs)
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
alembic upgrade head
uvicorn app.main:app --reload

# Frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

## Git workflow

- `main`: always working. Only the PM merges `develop` into it, every Wednesday, and tags a release.
- `develop`: integration branch. Pull request only, 1 approval, CI green.
- Feature branch per task, cut from `develop`: `<area>/<task-id>-<short-name>`, e.g. `be/W2-BE-03-mail-sync`.
- Commit format: `type(area): what changed [task-id]`, e.g. `feat(ai): add email classifier v1 [W2-AI-01]`.
- Squash and merge, delete the branch, then tick the task in the Project Hub.

Every day: `git checkout develop && git pull` → work on your branch → `git rebase develop` → push before you stop.

## Releases

| Tag | Date |
|---|---|
| `v0.1` setup | 28 Oct |
| `v0.2` | 4 Nov |
| `v0.3` feature freeze | 11 Nov |
| `v1.0` launch | 18 Nov |
