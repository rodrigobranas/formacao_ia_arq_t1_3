# Implementation Task: task_03.md

## Task Context

- **Title**: Auth service and routes (signup/signin)
- **Type**: backend
- **Complexity**: high
- **Dependencies**: task_01, task_02


<required_skills>
- `cy-workflow-memory`: required when workflow memory paths are provided for this task
- `cy-execute-task`: required end-to-end workflow for a PRD task
- `cy-final-verify`: required before any completion claim or automatic commit
</required_skills>

<critical>
- Use installed `cy-workflow-memory` before editing code when workflow memory paths are provided below.
- Use installed `cy-execute-task` as the execution workflow for this task.
- Read `AGENTS.md`, `CLAUDE.md`, and the PRD documents under `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin` before editing code.
- Treat the task specification below plus the supporting PRD documents, especially `_techspec.md` and `_tasks.md`, as the source of truth.
- Keep scope tight to this task and record meaningful follow-up work instead of expanding scope silently.
- Use installed `cy-final-verify` before any completion claim or automatic commit.
- Automatic commits are disabled for this run (`--auto-commit=false`).
</critical>

## Workflow Memory

- Memory directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin/memory`
- Shared workflow memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin/memory/MEMORY.md`
- Current task memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin/memory/task_03.md`
- Use installed `cy-workflow-memory` before editing code and before finishing the task.
- Read both memory files before implementation. Promote durable cross-task context only to shared workflow memory.
- Keep task-local decisions, learnings, touched surfaces, and corrections in the current task memory file.


## Task Specification

---
status: pending
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
- [ ] 3.1 Install bcrypt and @types/bcrypt packages
- [ ] 3.2 Implement auth service with signup logic (atomic org + user creation, bcrypt hashing)
- [ ] 3.3 Implement auth service with signin logic (credential verification, JWT generation)
- [ ] 3.4 Implement auth routes (POST /api/signup, POST /api/signin)
- [ ] 3.5 Register auth routes in the Express app entry point
- [ ] 3.6 Write service-level and route-level tests

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
  - [ ] Signup creates organization and user when all fields are valid
  - [ ] Signup hashes password before storing (stored password differs from input)
  - [ ] Signup sets founding user as admin
  - [ ] Signup returns 400 when required fields are missing (organizationName, name, email, password)
  - [ ] Signup returns 422 when email is already in use
  - [ ] Signup returns 422 when password is shorter than 8 characters
  - [ ] Signin returns JWT token and user info for valid credentials
  - [ ] Signin returns 401 for non-existent email
  - [ ] Signin returns 401 for wrong password
  - [ ] Signin JWT payload contains userId, organizationId, and admin flag
- Integration tests:
  - [ ] POST /api/signup with valid data returns 200 and creates org + user
  - [ ] POST /api/signup with duplicate email returns 422
  - [ ] POST /api/signup with missing fields returns 400
  - [ ] POST /api/signin with valid credentials returns 200 with token
  - [ ] POST /api/signin with invalid credentials returns 401
  - [ ] Signup + signin flow: created user can sign in and receive valid token
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Signup atomically creates organization and admin user
- Passwords stored as bcrypt hashes, never plaintext
- Signin returns valid JWT with correct payload
- No email enumeration possible through error messages


## Task Files

- PRD directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin`
- Task file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin/task_03.md`
- Master tasks file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin/_tasks.md`
- Use these exact paths when `cy-execute-task` updates task tracking.
- Execute every explicit `Validation`, `Test Plan`, or `Testing` item from the task and supporting PRD docs.
- Update task checkboxes and task status only after implementation, verification evidence, and self-review are complete.
- Update the master tasks file only when the current task is actually complete.
- Keep tracking-only files out of automatic commits unless the repository explicitly requires them to be staged.
- Do not create an automatic commit for this run. Leave the diff ready for manual review.
