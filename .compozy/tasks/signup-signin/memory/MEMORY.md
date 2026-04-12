# Workflow Memory

Keep only durable, cross-task context here. Do not duplicate facts that are obvious from the repository, PRD documents, or git history.

## Current State

- Task 01 landed the multi-tenant schema foundation in `database/init.sql` and updated backend tests are green against the recreated Postgres container.

## Shared Decisions

- Frontend auth is centralized in `packages/frontend/src/store/AuthContext.tsx`: it appends the bearer token to `/api` requests and signs the user out on `401`, so later frontend tasks can keep using plain `fetch("/api/...")` calls without per-page auth wiring.
- The frontend persists display fields (`name`, `organizationName`) in `localStorage` alongside the JWT because the backend token payload only includes `userId`, `organizationId`, and `admin`.

## Shared Learnings

- Local Docker schema changes in `database/init.sql` only take effect after recreating the Postgres volume/container because the file is mounted into `/docker-entrypoint-initdb.d/init.sql`.
- Backend Jest coverage is maintained through an explicit allowlist in `packages/backend/jest.config.ts`, so each new source file added by later tasks must also be added there or it will be excluded from coverage reporting.

## Open Risks

- None currently recorded.

## Handoffs

- Later auth and tenant-scoping tasks can assume `organizations`, `users`, and `organization_id` columns already exist in the database schema.
- Later frontend tasks can consume `useAuth()` for the authenticated user and rely on the public `/signin` and `/signup` routes already being wired in `packages/frontend/src/router.tsx`.
