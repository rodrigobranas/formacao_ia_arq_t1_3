# Task Memory: task_03.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

- Create the new `backend/` workspace for Express + TypeScript + pg-promise with a `/health` endpoint, local env defaults, and Jest smoke coverage using a mocked database.

## Important Decisions

- Exported `app` from `backend/src/index.ts` and guarded `listen()` with `require.main === module` so supertest can import the server without opening a port.
- Added a minimal Express error handler that returns `500` with `{ status: "error" }` to satisfy the task's failing-database unit test requirement while keeping route scope limited to `/health`.
- Included `dotenv/config` in both `database.ts` and `index.ts` so local env loading works without extra bootstrap code.

## Learnings

- The repository had no existing `backend/` workspace, so task completion depends on both file creation and a fresh root `npm install` to expand the workspace lockfile.
- Jest can load a TypeScript config file only when `ts-node` is installed alongside `ts-jest`, so `backend/jest.config.ts` needs that extra dev dependency.
- Keeping `rootDir` scoped to `src/` means `backend/tsconfig.json` should not include `jest.config.ts` in the TypeScript program.

## Files / Surfaces

- `backend/package.json`
- `backend/tsconfig.json`
- `backend/jest.config.ts`
- `backend/.env.example`
- `backend/src/database.ts`
- `backend/src/index.ts`
- `backend/src/health.test.ts`

## Errors / Corrections

- The environment did not have `rg` available, so repository discovery for this run used `find` and direct file reads instead.
- Initial backend test execution failed because `ts-node` was missing for `jest.config.ts`; adding it resolved Jest config loading.
- Initial backend type-checking failed because `jest.config.ts` was outside `rootDir`; removing it from `tsconfig.json` `include` resolved the error.

## Ready for Next Run

- Backend validation evidence for this run:
- `npm test --workspace=backend` passed with 2 tests and 88.88% statement/line coverage for `src/index.ts`.
- `npx tsc --noEmit -p backend/tsconfig.json` passed.
- `PORT=3001 npx tsx backend/src/index.ts` started successfully and logged `Server running on port 3001`.
