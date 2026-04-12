# Workflow Memory

Keep only durable, cross-task context here. Do not duplicate facts that are obvious from the repository, PRD documents, or git history.

## Current State

- task_01 (database indexes): done
- task_02 (dashboard types): done
- task_03 (dashboard service): done — 14 unit + 3 integration tests passing
- task_04 (dashboard API route): done — 8 integration tests passing, 93%+ coverage
- task_05 (recharts + KpiCard): done — 7 tests passing, 100% component coverage
- task_06 (DashboardPage rewrite): done — 16 tests passing, 97%+ coverage
- task_07 (TrendsTab): done — 10 tests passing, 93%+ line coverage

## Shared Decisions

- Backend dashboard types live in `packages/backend/src/services/dashboardTypes.ts` (separate from service file).
- Frontend dashboard types appended to `packages/frontend/src/types/types.ts`.

## Shared Learnings

- Frontend uses vitest + `.test.tsx` extension. Backend uses jest + `.test.ts`.
- Pre-existing TS errors in `AuthContext.tsx` — not blocking.
- Coverage config `include` in `vite.config.ts` now includes `src/components/**/*.tsx`.
- `@testing-library/user-event` is NOT installed. Use `fireEvent` from `@testing-library/react`.
- Sidebar label is "Organization" (not "Organization Settings") — tests updated in task_06.

## Open Risks

## Handoffs

- task_03 imports from `./dashboardTypes` in backend services.
- task_04 imports types for route response typing.
- tasks 05-07 import from `@/types/types` or relative path on frontend.
- task_07 (TrendsTab) should replace the placeholder in DashboardPage's "trends" tab.
