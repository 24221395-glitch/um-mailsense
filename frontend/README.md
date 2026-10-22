# frontend/ · owner: Wendi (UI/UX + Frontend)

Create these files (React · Vite · TypeScript · Tailwind CSS · React Router). Task IDs are from the Project Hub.

```
frontend/
├── package.json                    W1-FE-02 (project set-up, ESLint, Prettier)
├── src/
│   ├── main.tsx
│   ├── App.tsx                     W2-FE-02 (routing + layout)
│   ├── pages/
│   │   ├── LoginPage.tsx           W2-FE-02
│   │   ├── InboxPage.tsx           W2-FE-02
│   │   ├── SegmentPage.tsx         W3-FE-01
│   │   ├── AdBoardPage.tsx         W3-FE-01
│   │   ├── ProfilePage.tsx         W3-FE-01 (CV upload)
│   │   └── AdminPage.tsx           W3-FE-01
│   ├── components/
│   │   ├── EmailCard.tsx           W2-FE-03
│   │   ├── SegmentTabs.tsx         W2-FE-03
│   │   ├── AdCard.tsx              W2-FE-03
│   │   ├── DeadlineBadge.tsx       W2-FE-03
│   │   └── DeadlineCalendar.tsx    W3-FE-02 (with browser notifications)
│   ├── api/        client.ts, emails.ts, ads.ts, profile.ts, admin.ts   (the only place that calls the backend)
│   ├── types/
│   │   ├── api.ts                  types from docs/04-api-contract.md
│   │   └── api.generated.ts        generated from backend/openapi.json · never edit by hand
│   └── mocks/                      example data until W3-FE-03
└── public/
```

## Other tasks
- W3-FE-03 replace mocks with the real API (with Raihan) · due 10 Nov
- W3-FE-04 check every page on phone and laptop · due 11 Nov
- W4-FE-01 fix UI bugs and polish · W4-BE-02 production deploy (with Raihan)
- W1-BE-03 API contract (with Raihan and Iqbal) · W2-SA-03 prototype review (with Nazifa)

Rules: pages PascalCase ending in `Page` · components PascalCase · hooks `useSomething.ts`.
