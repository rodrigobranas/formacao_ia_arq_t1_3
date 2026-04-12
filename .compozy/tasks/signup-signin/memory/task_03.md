# Task Memory: task_03.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot
- Implement backend signup and signin with atomic organization + founding-admin creation, bcrypt password hashing, JWT issuance, public auth routes, and required automated coverage.

## Important Decisions
- Normalized auth emails to lowercase for both signup and signin so global uniqueness and credential lookup follow the database `LOWER(email)` unique index.
- Mapped auth route errors to task-specified status codes: `400` for missing required fields, `422` for duplicate email and short password, and `401` with a generic `Invalid credentials` message for signin failures.
- Returned signup success as `{ organization, user }` and signin success as the tech-spec shape `{ token, user: { userId, name, admin, organizationName } }`.

## Learnings
- `pg-promise` in this repo does not export `QueryResultError`; duplicate-email race handling must inspect PostgreSQL error code `23505` directly.
- Backend Jest coverage is controlled explicitly in `packages/backend/jest.config.ts`, so new auth files needed to be added there for the task coverage target to reflect the implementation.

## Files / Surfaces
- `packages/backend/package.json`
- `packages/backend/package-lock.json`
- `packages/backend/jest.config.ts`
- `packages/backend/src/index.ts`
- `packages/backend/src/routes/authRoutes.ts`
- `packages/backend/src/routes/authRoutes.test.ts`
- `packages/backend/src/services/authService.ts`
- `packages/backend/src/services/authService.test.ts`

## Errors / Corrections
- Initial test run failed because `QueryResultError` is not exported by the installed `pg-promise` version; corrected the duplicate-email guard to use the PostgreSQL `23505` error code check and reran the full backend suite successfully.

## Ready for Next Run
- Backend auth endpoints are in place and tested. Frontend auth tasks can rely on `POST /api/signup` and `POST /api/signin`, with signin returning the JWT plus `{ userId, name, admin, organizationName }`.
