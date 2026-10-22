# qa/ (owner: QA Tester)

| File | Task | Due |
|---|---|---|
| `test-plan.md` | W1-QA-01 | 27 Oct |
| `../.github/ISSUE_TEMPLATE/bug_report.md`, Issue labels | W1-QA-02 | 28 Oct |
| `test-cases.md` | W2-QA-01 | 3 Nov |
| `e2e/`, `api/` set-up and first smoke test | W2-QA-02 | 4 Nov |
| `api/` tests for emails, ads, admin | W3-QA-02 | 10 Nov |
| `reports/ai-accuracy.md` (with Iqbal) | W3-QA-03 | 11 Nov |
| `reports/regression.md`, `reports/security.md` | W4-QA-01, W4-QA-02 | 13 Nov |
| `reports/pilot.md` (with Nazifa) | W4-QA-03 | 14 Nov |
| `reports/release-signoff.md` | W4-QA-04 | 18 Nov |

```bash
# API tests (no database needed for the smoke tests), from the repo root
pytest qa/api -q

# Browser tests: start the frontend first (cd frontend && npm run dev)
cd qa/e2e
npm install
npx playwright install chromium
npm test
```

Every bug goes into GitHub Issues with the bug report template and a severity label.
