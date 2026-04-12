---
status: completed
title: Auth service and routes (signup/signin)
type: backend
complexity: high
dependencies:
  - task_01
  - task_02
---

# Task 3: Auth service and routes (signup/signin)

## Overview
Implement the signup and signin functionality. Signup atomically creates an organization and its founding admin user. Signin validates credentials and issues a JWT token. These are public endpoints (no auth middleware). This is the most complex backend task as it involves atomic transactions, password hashing, and token generation.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC "API Endpoints" section for request/response formats and status codes
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement POST `/api/signup` that creates organization + admin user atomically (database transaction)
- MUST accept signup body: `{ organizationName, name, email, password }`
- MUST validate all required fields are present (return 400 if missing)
- MUST validate email is globally unique across all organizations (return 422 if duplicate)
- MUST validate password minimum length of 8 characters (return 422 if too short)
- MUST hash passwords with bcrypt (10 salt rounds) before storage
- MUST set the founding user as admin (admin = true)
- MUST implement POST `/api/signin` that validates credentials and returns JWT
- MUST accept signin body: `{ email, password }`
- MUST return 401 with generic "Invalid credentials" message for wrong email or password (no email enumeration)
- MUST return JWT token and user info on successful signin (see TechSpec signin response format)
- MUST include `userId`, `organizationId`, and `admin` in JWT payload
- MUST install `bcrypt` and `@types/bcrypt` as dependencies
- MUST register auth routes in the Express app
</requirements>

## Subtasks
- [x] 3.1 Install bcrypt and @types/bcrypt packages
- [x] 3.2 Implement auth service with signup logic (atomic org + user creation, bcrypt hashing)
- [x] 3.3 Implement auth service with signin logic (credential verification, JWT generation)
- [x] 3.4 Implement auth routes (POST /api/signup, POST /api/signin)
- [x] 3.5 Register auth routes in the Express app entry point
- [x] 3.6 Write service-level and route-level tests

## Implementation Details
Create `authService.ts` in the services directory and `authRoutes.ts` in the routes directory. Follow existing patterns from `ticketTypeService.ts` and `ticketTypeRoutes.ts`. See TechSpec "API Endpoints" section for exact request/response formats. The signup must use a pg-promise transaction to ensure atomicity. Register routes in `packages/backend/src/index.ts`.

### Relevant Files
- `packages/backend/src/services/ticketTypeService.ts` — Reference for service pattern (validation, error classes, db queries)
- `packages/backend/src/routes/ticketTypeRoutes.ts` — Reference for route pattern (error mapping, async handlers)
- `packages/backend/src/index.ts` — Express app setup where routes are registered
- `packages/backend/src/data/database.ts` — Database connection for transactions
- `packages/backend/src/data/authMiddleware.ts` — JWT signing uses same secret as verification (task_02)

### Dependent Files
- `packages/backend/src/index.ts` — Must register new auth routes
- `packages/frontend/src/pages/SignupPage.tsx` — Will call signup API (task_08)
- `packages/frontend/src/pages/SigninPage.tsx` — Will call signin API (task_08)
- `packages/frontend/src/store/AuthContext.tsx` — Will use signin response format (task_07)

### Related ADRs
- [ADR-001: All-in-one MVP](adrs/adr-001.md) — Signup creates org + admin atomically in single phase
- [ADR-002: JWT Stateless Authentication with bcrypt](adrs/adr-002.md) — Defines bcrypt salt rounds, JWT payload, and token generation approach

## Deliverables
- `packages/backend/src/services/authService.ts` with signup and signin logic
- `packages/backend/src/routes/authRoutes.ts` with POST /api/signup and POST /api/signin
- bcrypt package installed
- Routes registered in Express app
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for auth endpoints **(REQUIRED)**

## Tests
- Unit tests:
  - [x] Signup creates organization and user when all fields are valid
  - [x] Signup hashes password before storing (stored password differs from input)
  - [x] Signup sets founding user as admin
  - [x] Signup returns 400 when required fields are missing (organizationName, name, email, password)
  - [x] Signup returns 422 when email is already in use
  - [x] Signup returns 422 when password is shorter than 8 characters
  - [x] Signin returns JWT token and user info for valid credentials
  - [x] Signin returns 401 for non-existent email
  - [x] Signin returns 401 for wrong password
  - [x] Signin JWT payload contains userId, organizationId, and admin flag
- Integration tests:
  - [x] POST /api/signup with valid data returns 200 and creates org + user
  - [x] POST /api/signup with duplicate email returns 422
  - [x] POST /api/signup with missing fields returns 400
  - [x] POST /api/signin with valid credentials returns 200 with token
  - [x] POST /api/signin with invalid credentials returns 401
  - [x] Signup + signin flow: created user can sign in and receive valid token
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Signup atomically creates organization and admin user
- Passwords stored as bcrypt hashes, never plaintext
- Signin returns valid JWT with correct payload
- No email enumeration possible through error messages
