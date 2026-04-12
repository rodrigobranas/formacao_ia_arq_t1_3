# Task Memory: task_01.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

- Extend `database/init.sql` with `ticket_types`, `tickets`, and seed data; add a real-DB backend test helper plus smoke/integration coverage for schema constraints and cleanup.

## Important Decisions

- Reused the existing `db` instance in `backend/src/testHelper.ts` instead of creating a second pg-promise database object, avoiding duplicate-connection warnings during Jest runs.
- Expanded backend Jest coverage collection to `src/**/*.ts` excluding test files so this task's new helper module is included in the coverage gate.

## Learnings

- Running `make db:reset` concurrently with integration tests can invalidate schema/seed verification because test cleanup may hit the freshly recreated container. Reset and schema inspection need to run sequentially.
- The repository-level `make test` currently fails because `frontend/src/App.test.tsx` expects old landing-page text that no longer renders.

## Files / Surfaces

- `database/init.sql`
- `backend/src/database.ts`
- `backend/src/testHelper.ts`
- `backend/src/testHelper.test.ts`
- `backend/jest.config.ts`

## Errors / Corrections

- Corrected an initial `testHelper` implementation that instantiated a second database object with the same config and triggered a pg-promise duplicate-connection warning.
- Discarded overlapped verification evidence after `make db:reset` was started in parallel with a backend test rerun; reran verification sequentially afterward.

## Ready for Next Run

- Task-specific backend verification is clean.
- Task tracking files were intentionally not updated because the repo-level `make test` gate failed in unrelated frontend tests.
- Next run can either fix or waive the frontend `App.test.tsx` baseline failure, then update task tracking if completion is allowed.
