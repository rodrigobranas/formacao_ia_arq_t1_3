---
status: completed
title: Auth middleware (JWT + admin)
type: backend
complexity: low
dependencies:
  - task_01
---

# Task 2: Auth middleware (JWT + admin)

## Overview
Implement the Express middlewares for authentication and authorization. The auth middleware verifies JWT tokens from the Authorization header and attaches user context to the request. The admin middleware checks that the authenticated user has admin privileges. These middlewares are used by all protected endpoints.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC "Core Interfaces" section for AuthenticatedRequest interface and middleware signature
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST extract JWT from `Authorization: Bearer <token>` header
- MUST verify token using `jsonwebtoken` package with `JWT_SECRET` environment variable
- MUST attach `{ userId, organizationId, admin }` to the request object on success
- MUST return 401 with `{ message: "Token not provided" }` when no token is present
- MUST return 401 with appropriate message when token is invalid or expired
- MUST implement admin middleware that returns 403 when `req.user.admin` is not true
- MUST install `jsonwebtoken` and `@types/jsonwebtoken` as dependencies
- MUST define the `AuthenticatedRequest` interface extending Express `Request`
</requirements>

## Subtasks
- [x] 2.1 Install jsonwebtoken and @types/jsonwebtoken packages
- [x] 2.2 Define the `AuthenticatedRequest` interface with user context
- [x] 2.3 Implement auth middleware for JWT verification
- [x] 2.4 Implement admin middleware for role checking
- [x] 2.5 Write tests for both middlewares

## Implementation Details
Create a new middleware file in the backend data layer. See TechSpec "Core Interfaces" section for the `AuthenticatedRequest` interface definition and middleware signature. The JWT_SECRET should be read from environment variables via dotenv (already configured in the project).

### Relevant Files
- `packages/backend/src/index.ts` — Express app setup, where middleware will be imported
- `packages/backend/package.json` — Dependencies to update with jsonwebtoken
- `packages/backend/src/routes/ticketTypeRoutes.ts` — Example of existing route pattern that will use middleware

### Dependent Files
- `packages/backend/src/routes/authRoutes.ts` — Will use middleware for protected endpoints (task_03)
- `packages/backend/src/routes/userRoutes.ts` — Will use both middlewares (task_05)
- `packages/backend/src/routes/organizationRoutes.ts` — Will use both middlewares (task_06)
- `packages/backend/src/routes/ticketTypeRoutes.ts` — Will add middleware to existing routes (task_04)

### Related ADRs
- [ADR-002: JWT Stateless Authentication with bcrypt Password Hashing](adrs/adr-002.md) — Defines JWT payload structure, secret management, and token verification approach

## Deliverables
- `packages/backend/src/data/authMiddleware.ts` with auth and admin middlewares
- `AuthenticatedRequest` interface exported for use by route handlers
- jsonwebtoken package installed
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for middleware behavior **(REQUIRED)**

## Tests
- Unit tests:
  - [ ] Auth middleware attaches user context when valid token is provided
  - [ ] Auth middleware returns 401 when no Authorization header is present
  - [ ] Auth middleware returns 401 when token format is invalid
  - [ ] Auth middleware returns 401 when token signature is invalid
  - [ ] Auth middleware returns 401 when token is expired
  - [ ] Admin middleware calls next() when req.user.admin is true
  - [ ] Admin middleware returns 403 when req.user.admin is false
- Integration tests:
  - [ ] Protected endpoint returns 401 without token
  - [ ] Protected endpoint succeeds with valid token
  - [ ] Admin endpoint returns 403 with valid non-admin token
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Auth middleware correctly verifies JWT tokens and attaches user context
- Admin middleware correctly enforces admin role
- Both middlewares follow Express middleware signature conventions
