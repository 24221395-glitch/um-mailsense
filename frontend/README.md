# frontend/ (owner: Wendi)

React 18 + Vite + TypeScript + Tailwind CSS + React Router.

| Path | Task | Due |
|---|---|---|
| project set-up | W1-FE-02 | 28 Oct |
| app shell, `LoginPage`, `InboxPage` on mocks | W2-FE-02 | 4 Nov |
| `src/components/` | W2-FE-03 | 4 Nov |
| `SegmentPage`, `AdBoardPage`, `ProfilePage`, `AdminPage` | W3-FE-01 | 8 Nov |
| `DeadlineCalendar` + notifications | W3-FE-02 | 9 Nov |
| connect to real API (`VITE_USE_MOCKS=false`) | W3-FE-03 (with Raihan) | 10 Nov |
| phone / laptop check | W3-FE-04 | 11 Nov |

```bash
npm install
npm run dev          # http://localhost:5173
npm run lint && npm run typecheck && npm run build
```

## Data
- All server calls go through `src/api/` only. Pages never call `fetch` directly.
- `VITE_USE_MOCKS=true` (default) serves data from `src/mocks/`, so the UI works before the backend.
- `src/types/api.ts` holds the API types from `docs/04-api-contract.md`. From Week 2,
  run `npm run gen:api` after the backend changes and import from `src/types/api.generated.ts`.
  Never hand-edit the generated file.
