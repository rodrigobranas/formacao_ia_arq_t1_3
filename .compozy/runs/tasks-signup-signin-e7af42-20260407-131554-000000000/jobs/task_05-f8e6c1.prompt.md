# Implementation Task: task_05.md

## Task Context

- **Title**: User management service and routes
- **Type**: backend
- **Complexity**: medium
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
- Current task memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin/memory/task_05.md`
- Use installed `cy-workflow-memory` before editing code and before finishing the task.
- Read both memory files before implementation. Promote durable cross-task context only to shared workflow memory.
- Keep task-local decisions, learnings, touched surfaces, and corrections in the current task memory file.


## Task Specification

---
status: pending
title: User management service and routes
type: backend
complexity: medium
dependencies:
  - task_01
  - task_02
---

# Task 5: User management service and routes

## Overview
Implement user CRUD functionality scoped to the authenticated admin's organization. Admins can list, create, and delete users within their organization. Includes email uniqueness validation across all organizations, bcrypt password hashing for new users, and a safety guard preventing admins from deleting themselves.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC "API Endpoints — Users" section for request/response formats
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement GET `/api/users` that lists all users in the admin's organization (excluding password field)
- MUST implement POST `/api/users` that creates a user in the admin's organization
- MUST accept create body: `{ name, email, password, admin }`
- MUST hash password with bcrypt before storage
- MUST validate all required fields are present (return 400)
- MUST validate email global uniqueness (return 422 if duplicate)
- MUST validate password minimum 8 characters (return 422)
- MUST implement DELETE `/api/users/:userId` that removes a user from the organization
- MUST return 404 if user does not exist or belongs to a different organization
- MUST return 403 if admin attempts to delete themselves
- MUST apply auth middleware + admin middleware to all user routes
</requirements>

## Subtasks
- [ ] 5.1 Implement user service with list, create, and delete functions
- [ ] 5.2 Implement input validation (required fields, email uniqueness, password length)
- [ ] 5.3 Implement admin self-delete prevention
- [ ] 5.4 Implement user routes with auth + admin middleware
- [ ] 5.5 Register user routes in the Express app
- [ ] 5.6 Write service-level and route-level tests

## Implementation Details
Create `userService.ts` in the services directory and `userRoutes.ts` in the routes directory. Follow existing patterns from `ticketTypeService.ts` and `ticketTypeRoutes.ts`. See TechSpec "API Endpoints — Users" section for status codes and behavior. Never return the password field in API responses.

### Relevant Files
- `packages/backend/src/services/ticketTypeService.ts` — Reference for service pattern (validation, error classes)
- `packages/backend/src/routes/ticketTypeRoutes.ts` — Reference for route pattern (error mapping, async handlers)
- `packages/backend/src/data/authMiddleware.ts` — Auth and admin middlewares (task_02)
- `packages/backend/src/data/database.ts` — Database connection
- `packages/backend/src/index.ts` — Where to register routes

### Dependent Files
- `packages/backend/src/index.ts` — Must register new user routes
- `packages/frontend/src/pages/UsersPage.tsx` — Will call user API (task_10)

## Deliverables
- `packages/backend/src/services/userService.ts` with list, create, delete logic
- `packages/backend/src/routes/userRoutes.ts` with GET, POST, DELETE endpoints
- Routes registered in Express app
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for user endpoints **(REQUIRED)**

## Tests
- Unit tests:
  - [ ] list() returns all users in the given organization without password field
  - [ ] create() creates user with hashed password in the given organization
  - [ ] create() returns validation error when required fields are missing
  - [ ] create() returns error when email is already in use (same org)
  - [ ] create() returns error when email is already in use (different org)
  - [ ] create() returns error when password is shorter than 8 characters
  - [ ] delete() removes user belonging to the given organization
  - [ ] delete() returns NotFoundError for user in a different organization
  - [ ] delete() returns error when admin tries to delete themselves
- Integration tests:
  - [ ] GET /api/users returns 401 without token
  - [ ] GET /api/users returns 403 with non-admin token
  - [ ] GET /api/users returns user list with admin token (no password in response)
  - [ ] POST /api/users creates user with admin token
  - [ ] POST /api/users returns 422 for duplicate email
  - [ ] DELETE /api/users/:id returns 403 when admin deletes self
  - [ ] DELETE /api/users/:id returns 404 for user in different org
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Users fully scoped to organization — no cross-org visibility
- Passwords never returned in API responses
- Admin self-delete prevented
- Email uniqueness enforced globally


## Task Files

- PRD directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin`
- Task file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin/task_05.md`
- Master tasks file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin/_tasks.md`
- Use these exact paths when `cy-execute-task` updates task tracking.
- Execute every explicit `Validation`, `Test Plan`, or `Testing` item from the task and supporting PRD docs.
- Update task checkboxes and task status only after implementation, verification evidence, and self-review are complete.
- Update the master tasks file only when the current task is actually complete.
- Keep tracking-only files out of automatic commits unless the repository explicitly requires them to be staged.
- Do not create an automatic commit for this run. Leave the diff ready for manual review.
