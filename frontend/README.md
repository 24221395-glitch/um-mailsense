# frontend/ · owner: Wendi

Create these files (React + Vite + TypeScript + Tailwind):

```
frontend/
├── package.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── pages/        LoginPage.tsx, InboxPage.tsx, SegmentPage.tsx, AdBoardPage.tsx, ProfilePage.tsx, AdminPage.tsx
│   ├── components/   EmailCard.tsx, SegmentTabs.tsx, AdCard.tsx, DeadlineCalendar.tsx
│   ├── api/          client.ts, emails.ts, ads.ts, profile.ts, admin.ts   (the only place that calls the backend)
│   ├── types/        api.ts
│   └── mocks/        example data until Week 3
└── public/
```

Pages: PascalCase ending in `Page`. Components: PascalCase. Hooks: `useSomething.ts`.
