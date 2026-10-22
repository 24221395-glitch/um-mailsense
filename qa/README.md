# qa/ · owner: QA Tester

Create these files. Task IDs are from the Project Hub.

```
qa/
├── test-plan.md                W1-QA-01
├── test-cases.md               W2-QA-01 (40+ cases from docs/06-acceptance-criteria.md)
├── e2e/                        Playwright browser tests · W2-QA-02
├── api/                        pytest API tests · W2-QA-02, W3-QA-02
└── reports/
    ├── ai-accuracy.md          W3-QA-03 (with Iqbal)
    ├── regression.md           W4-QA-01
    ├── security.md             W4-QA-02 (with Raihan)
    ├── pilot.md                W4-QA-03 (with Nazifa)
    └── release-signoff.md      W4-QA-04
```

Also yours: `.github/ISSUE_TEMPLATE/bug_report.md` and the Issue labels (bug, sev-1, sev-2, sev-3, fe, be, ai) · W1-QA-02.

## Other tasks
- W3-QA-01 test every feature as it is merged into `develop`; log bugs as GitHub Issues
- W2-SA-02 acceptance criteria and W3-SA-02 pilot plan (with Nazifa)
