# Task Memory: task_02.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

- Implement the backend ticket type service layer with PostgreSQL-backed integration tests and verify it against the existing repo gates.

## Important Decisions

- Exported descriptive service-layer error classes (`ValidationError`, `ConflictError`, `NotFoundError`, `InUseError`) so task_03 route handlers can map failures to HTTP status codes without parsing database errors.
- Normalized `name` with trimming and treated blank `description` as `null` in the service layer to keep persistence consistent with optional descriptions.
- Updated the backend Jest script to run in band because the real-database integration tests share mutable PostgreSQL state.

## Learnings

- The existing `testHelper.test.ts` seed assertion depended on ambient database state; it had to be made self-contained once task_02 added its own truncation-based integration suite.
- Backend verification is clean with coverage after adding the service layer: `npm run test --workspace backend` passes with 23 tests and 92% statements / 91.83% lines overall.
- Repository-wide `make test` still fails in `frontend/src/App.test.tsx` because those tests assert outdated landing-page content while the app now renders the API health-check state.

## Files / Surfaces

- `backend/src/ticketTypeService.ts`
- `backend/src/ticketTypeService.test.ts`
- `backend/src/testHelper.test.ts`
- `backend/package.json`

## Errors / Corrections

- Corrected a TypeScript type issue by splitting required-name validation into a `requireName()` helper before uniqueness checks.
- Corrected backend suite instability by removing the seed-data test's dependency on global DB state.

## Ready for Next Run

- Task implementation is in place and backend verification is green.
- Do not mark `task_02` complete until the unrelated frontend `make test` failure is resolved or explicitly waived.
