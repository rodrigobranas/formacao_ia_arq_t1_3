# Task Memory: task_06.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

- Implement backend organization self-service read/update endpoints for the authenticated user's current organization.
- Keep scope limited to backend service, routes, route registration, tests, and required tracking updates.

## Important Decisions

- Follow the existing backend pattern used by `ticketTypeService` and `userRoutes`: service owns validation/error types, routes translate known errors into HTTP status codes.
- Return `404 { error: "Organization not found" }` when the authenticated token references an organization row that does not exist, instead of converting that state into a generic server error.

## Learnings

- No `AGENTS.md` or `CLAUDE.md` files are present in this workspace, so task execution relies on the task spec, PRD docs, ADRs, and repository patterns.
- Backend Jest coverage is controlled by an explicit `collectCoverageFrom` allowlist, so new organization source files must be added there for coverage reporting to reflect this task.
- The backend package has no broader verify script than `npm test`, so the full Jest suite with coverage is the strongest available local verification command for this task.

## Files / Surfaces

- `packages/backend/src/index.ts`
- `packages/backend/jest.config.ts`
- `packages/backend/src/services/organizationService.ts`
- `packages/backend/src/services/organizationService.test.ts`
- `packages/backend/src/routes/organizationRoutes.ts`
- `packages/backend/src/routes/organizationRoutes.test.ts`

## Errors / Corrections

- `rg` is not installed in this environment; use `find` and `grep` for repository discovery.
- Replaced an invalid test setup that attempted to delete an organization with dependent users; the final 404 route test now uses a token that references a missing organization id.

## Ready for Next Run

- Backend org endpoints are implemented and verified; the next dependent frontend task can call `GET /api/organizations/current` and `POST /api/organizations/current/change-name`.
