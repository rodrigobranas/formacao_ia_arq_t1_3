---
status: completed
title: Tenant-scoped ticket types service and routes
type: backend
complexity: medium
dependencies:
  - task_01
  - task_02
---

# Task 4: Tenant-scoped ticket types service and routes

## Overview
Update the existing ticket type service and routes to support multi-tenancy. All queries must filter by the authenticated user's organization. Auth middleware is applied to all routes, and admin middleware is applied to mutation routes (create, update, delete). The unique name constraint becomes org-scoped.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC "Existing endpoints (updated with auth middleware)" section for changes
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST add auth middleware to all ticket type routes (GET, POST, PUT, DELETE)
- MUST add admin middleware to mutation routes (POST, PUT, DELETE)
- MUST update `list()` to filter by `organizationId` from the authenticated user context
- MUST update `create()` to set `organization_id` from the authenticated user context
- MUST update `update()` to scope the update to the user's organization
- MUST update `remove()` to scope the deletion to the user's organization
- MUST update name uniqueness validation to be org-scoped (same name allowed in different orgs)
- MUST return 404 if a ticket type belongs to a different organization
- MUST update all function signatures to accept `organizationId` parameter
</requirements>

## Subtasks
- [x] 4.1 Update ticketTypeService function signatures to accept organizationId
- [x] 4.2 Update all SQL queries to filter/set organization_id
- [x] 4.3 Update name uniqueness validation to be org-scoped
- [x] 4.4 Apply auth middleware to all ticket type routes
- [x] 4.5 Apply admin middleware to mutation routes (POST, PUT, DELETE)
- [x] 4.6 Update existing tests and add new org-scoping tests

## Implementation Details
Modify the existing `ticketTypeService.ts` and `ticketTypeRoutes.ts` files. See TechSpec "Existing endpoints (updated with auth middleware)" table for the specific changes per route. Route handlers will read `organizationId` from `(req as AuthenticatedRequest).user.organizationId`.

### Relevant Files
- `packages/backend/src/services/ticketTypeService.ts` — Service with list, create, update, remove functions to modify
- `packages/backend/src/routes/ticketTypeRoutes.ts` — Routes to add middleware and pass organizationId
- `packages/backend/src/data/authMiddleware.ts` — Auth and admin middlewares to apply (task_02)
- `packages/backend/src/services/ticketTypeService.test.ts` — Existing service tests to update
- `packages/backend/src/routes/ticketTypeRoutes.test.ts` — Existing route tests to update

### Dependent Files
- `packages/frontend/src/pages/TicketTypesPage.tsx` — Frontend will need auth headers (task_12)

## Deliverables
- Updated `ticketTypeService.ts` with org-scoped queries
- Updated `ticketTypeRoutes.ts` with auth/admin middlewares
- Updated existing tests to pass organizationId
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for org-scoped behavior **(REQUIRED)**

## Tests
- Unit tests:
  - [x] list() returns only ticket types for the given organizationId
  - [x] create() assigns the provided organizationId to the new ticket type
  - [x] create() allows duplicate names across different organizations
  - [x] create() prevents duplicate names within the same organization
  - [x] update() only modifies ticket types belonging to the given organization
  - [x] update() returns NotFoundError for ticket types in other organizations
  - [x] remove() only deletes ticket types belonging to the given organization
  - [x] remove() returns NotFoundError for ticket types in other organizations
- Integration tests:
  - [x] GET /api/ticket-types returns 401 without auth token
  - [x] GET /api/ticket-types returns only org-scoped ticket types with valid token
  - [x] POST /api/ticket-types returns 403 with non-admin token
  - [x] POST /api/ticket-types creates org-scoped ticket type with admin token
  - [x] PUT /api/ticket-types/:id returns 403 with non-admin token
  - [x] DELETE /api/ticket-types/:id returns 403 with non-admin token
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Ticket types are fully org-scoped — no cross-organization data visibility
- Auth required for all endpoints, admin required for mutations
- Existing test suite updated and passing
