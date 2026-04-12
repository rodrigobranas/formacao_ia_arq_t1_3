---
status: completed
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
- [x] 5.1 Implement user service with list, create, and delete functions
- [x] 5.2 Implement input validation (required fields, email uniqueness, password length)
- [x] 5.3 Implement admin self-delete prevention
- [x] 5.4 Implement user routes with auth + admin middleware
- [x] 5.5 Register user routes in the Express app
- [x] 5.6 Write service-level and route-level tests

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
  - [x] list() returns all users in the given organization without password field
  - [x] create() creates user with hashed password in the given organization
  - [x] create() returns validation error when required fields are missing
  - [x] create() returns error when email is already in use (same org)
  - [x] create() returns error when email is already in use (different org)
  - [x] create() returns error when password is shorter than 8 characters
  - [x] delete() removes user belonging to the given organization
  - [x] delete() returns NotFoundError for user in a different organization
  - [x] delete() returns error when admin tries to delete themselves
- Integration tests:
  - [x] GET /api/users returns 401 without token
  - [x] GET /api/users returns 403 with non-admin token
  - [x] GET /api/users returns user list with admin token (no password in response)
  - [x] POST /api/users creates user with admin token
  - [x] POST /api/users returns 422 for duplicate email
  - [x] DELETE /api/users/:id returns 403 when admin deletes self
  - [x] DELETE /api/users/:id returns 404 for user in different org
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Users fully scoped to organization — no cross-org visibility
- Passwords never returned in API responses
- Admin self-delete prevented
- Email uniqueness enforced globally
