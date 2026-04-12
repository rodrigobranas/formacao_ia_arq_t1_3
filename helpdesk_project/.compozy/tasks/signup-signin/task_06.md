---
status: completed
title: Organization service and routes
type: backend
complexity: low
dependencies:
  - task_01
  - task_02
---

# Task 6: Organization service and routes

## Overview
Implement endpoints for reading and updating organization settings. Any authenticated user can read the current organization details. Only admins can update the organization name. This is a small, focused task covering organization self-service settings.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC "API Endpoints — Organizations" section for request/response formats
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement GET `/api/organizations/current` that returns the authenticated user's organization
- MUST apply auth middleware to GET (any authenticated user can read)
- MUST implement POST `/api/organizations/current/change-name` that updates the organization name
- MUST accept change-name body: `{ name }`
- MUST validate name is present and not empty (return 400)
- MUST validate name length (VARCHAR(100) limit, return 422 if exceeded)
- MUST apply auth middleware + admin middleware to POST
- MUST return the updated organization on success
</requirements>

## Subtasks
- [x] 6.1 Implement organization service with get and changeName functions
- [x] 6.2 Implement input validation for organization name
- [x] 6.3 Implement organization routes with appropriate middleware
- [x] 6.4 Register organization routes in the Express app
- [x] 6.5 Write service-level and route-level tests

## Implementation Details
Create `organizationService.ts` in the services directory and `organizationRoutes.ts` in the routes directory. Follow existing patterns. See TechSpec "API Endpoints — Organizations" section. The GET endpoint uses auth middleware only; the POST uses auth + admin.

### Relevant Files
- `packages/backend/src/services/ticketTypeService.ts` — Reference for service pattern
- `packages/backend/src/routes/ticketTypeRoutes.ts` — Reference for route pattern
- `packages/backend/src/data/authMiddleware.ts` — Auth and admin middlewares (task_02)
- `packages/backend/src/data/database.ts` — Database connection
- `packages/backend/src/index.ts` — Where to register routes

### Dependent Files
- `packages/backend/src/index.ts` — Must register new organization routes
- `packages/frontend/src/pages/OrganizationSettingsPage.tsx` — Will call org API (task_11)

## Deliverables
- `packages/backend/src/services/organizationService.ts` with get and changeName logic
- `packages/backend/src/routes/organizationRoutes.ts` with GET and POST endpoints
- Routes registered in Express app
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for organization endpoints **(REQUIRED)**

## Tests
- Unit tests:
  - [x] get() returns the organization by id
  - [x] get() returns null/error for non-existent organization
  - [x] changeName() updates the organization name
  - [x] changeName() returns validation error for empty name
  - [x] changeName() returns validation error for name exceeding 100 characters
- Integration tests:
  - [x] GET /api/organizations/current returns 401 without token
  - [x] GET /api/organizations/current returns organization with valid token
  - [x] POST /api/organizations/current/change-name returns 403 with non-admin token
  - [x] POST /api/organizations/current/change-name updates name with admin token
  - [x] POST /api/organizations/current/change-name returns 400 for empty name
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Organization read accessible to any authenticated user
- Organization update restricted to admins
- Name validation enforced
