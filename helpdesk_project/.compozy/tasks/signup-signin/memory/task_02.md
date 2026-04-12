# Task Memory: task_02.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

- Implement JWT auth and admin Express middlewares for backend protected routes, add JWT dependencies, and cover both middleware layers with unit and integration tests.

## Important Decisions

- Auth middleware accepts only `Authorization: Bearer <token>` headers; missing headers return `401 { message: "Token not provided" }`, while malformed, invalid-signature, and structurally invalid tokens return `401 { message: "Invalid token" }`.
- Expired JWTs return `401 { message: "Token expired" }` to distinguish expiry from other verification failures.
- The middleware normalizes the verified payload before attaching it to `req.user` so route code receives only `{ userId, organizationId, admin }` and not JWT metadata such as `iat`.

## Learnings

- Backend Jest coverage was pinned to an explicit file list in `packages/backend/jest.config.ts`, so the new middleware file had to be added there for this task's coverage target to reflect the new surface.
- `AGENTS.md` and `CLAUDE.md` were not present anywhere in this workspace, so execution proceeded from the PRD, tech spec, ADRs, and repository sources only.

## Files / Surfaces

- `packages/backend/package.json`
- `packages/backend/package-lock.json`
- `packages/backend/.env.example`
- `packages/backend/jest.config.ts`
- `packages/backend/src/data/authMiddleware.ts`
- `packages/backend/src/data/authMiddleware.test.ts`
- `.compozy/tasks/signup-signin/task_02.md`
- `.compozy/tasks/signup-signin/_tasks.md`

## Errors / Corrections

- Initial middleware implementation attached the full verified JWT payload, which included `iat`; corrected it to attach only the typed user context required by the tech spec.

## Ready for Next Run

- Task 03 and later protected-route tasks can import `authMiddleware`, `adminMiddleware`, and `AuthenticatedRequest` from `packages/backend/src/data/authMiddleware.ts`.
