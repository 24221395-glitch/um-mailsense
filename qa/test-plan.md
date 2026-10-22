# Test Plan

**Owner:** QA Tester · **Task:** W1-QA-01 · **Due:** 27 Oct · **Status:** DRAFT

## 1. Scope
In scope: sign-in, inbox sync, segments, segment correction, CV upload, recommendations, ad board,
organisation registration, admin approval, deadlines, phone and laptop layouts.
Out of scope: Microsoft 365 itself, the LLM provider's availability.

## 2. Test levels
| Level | Tool | Who writes | Where |
|---|---|---|---|
| Unit | pytest | Raihan (backend), Iqbal (ai) | `backend/tests`, `ai/tests` |
| API | pytest + FastAPI TestClient | QA | `qa/api` |
| End-to-end | Playwright | QA | `qa/e2e` |
| AI accuracy | `ai/eval/run_eval.py` + manual check | QA with Iqbal | `qa/reports/ai-accuracy.md` |
| Pilot | ~20 students, feedback form | QA with Nazifa | `qa/reports/pilot.md` |

## 3. Environments
- Local: docker compose + dev servers
- `develop`: tested after every merge (W3-QA-01)
- Production: smoke test after deploy (W4-QA-04)

## 4. Entry and exit criteria
- **Entry:** feature merged into `develop`, CI green
- **Exit (launch):** all test cases run, 0 open sev-1 bugs, sev-2 bugs have workarounds, classifier ≥ 85%

## 5. Bug severity
| Severity | Meaning | Fix by |
|---|---|---|
| sev-1 | Core flow broken (login, inbox, segments) or data leak | Same day |
| sev-2 | Feature wrong, workaround exists | Before next release |
| sev-3 | Cosmetic | When time allows |
