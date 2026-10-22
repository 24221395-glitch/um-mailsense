# UM MailSense

AI-powered Siswamail organiser and opportunity recommender for Universiti Malaya students.
**Project window:** 22 Oct – 18 Nov 2026 · **Launch:** 18 Nov 2026

Each member creates the files inside **their own folder only**. The exact file names are listed in
each folder's README. Use those names, so nothing clashes when we merge.

| Folder | Owner | Branch prefix |
|---|---|---|
| `ai/` | Bari Iqbal Ibn Abdul (24221395) · PM + AI / LLM | `ai/`, `pm/` |
| `docs/` | Nazifa Tunazzina Ahamed (25072208) · System Analyst | `docs/` |
| `design/`, `frontend/` | Luo Wendi (24231632) · UI/UX + Frontend | `fe/` |
| `backend/` | Raihan Quddus Tamir (24215489) · Backend + DevOps | `be/` |
| `qa/` | QA Tester (name to add) | `qa/` |

## Files at the repo root
| File | Owner | Status |
|---|---|---|
| `README.md` | Iqbal | done |
| `.gitignore` | Iqbal | done |
| `.github/CODEOWNERS` | Iqbal | replace `@nazifa-handle`, `@wendi-handle`, `@raihan-handle`, `@qa-handle` with real usernames |
| `.github/pull_request_template.md` | Iqbal | done |
| `.github/ISSUE_TEMPLATE/bug_report.md` | QA | W1-QA-02 |
| `.github/workflows/ci.yml` | Raihan | W1-BE-02 |
| `docker-compose.yml`, `.env.example`, `.pre-commit-config.yaml` | Raihan | W1-BE-02 |

## Git rules (full version in the Project Hub)
- `main`: only the PM merges `develop` into it, every Wednesday.
- `develop`: all work comes together here through pull requests.
- One branch per task from `develop`: `<area>/<task-id>-<short-name>`, e.g. `be/W2-BE-03-mail-sync`.
- Commit format: `type(area): what changed [task-id]`, e.g. `feat(ai): add email classifier [W2-AI-01]`.
- Never edit another member's folder. Shared files (marked SHARED in the folder READMEs) need every owner's approval.
