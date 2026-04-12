---
status: completed
title: Frontend TicketTypesPage update with auth
type: frontend
complexity: low
dependencies:
  - task_04
  - task_07
---

# Task 12: Frontend TicketTypesPage update with auth

## Overview
Update the existing TicketTypesPage to work with the new authentication system. All API calls must include the Authorization header. Create, edit, and delete operations must be restricted to admin users. The page must handle 401 responses by triggering signout.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for updated ticket type endpoints
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST add Authorization Bearer token header to all fetch calls (GET, POST, PUT, DELETE)
- MUST get token from AuthContext
- MUST hide create, edit, and delete controls for non-admin users
- MUST show ticket types in read-only mode for regular users
- MUST handle 401 responses by triggering signout (redirect to signin)
- MUST preserve all existing functionality for admin users
</requirements>

## Subtasks
- [ ] 12.1 Add Authorization header to all fetch calls
- [ ] 12.2 Conditionally render create/edit/delete controls based on admin role
- [ ] 12.3 Handle 401 responses globally (trigger signout)
- [ ] 12.4 Update existing tests and add new auth-related tests

## Implementation Details
Modify the existing `TicketTypesPage.tsx` to use AuthContext. Get the token and admin flag from the `useAuth()` hook. Add the Authorization header to all fetch calls. Conditionally render mutation controls based on the admin flag.

### Relevant Files
- `packages/frontend/src/pages/TicketTypesPage.tsx` — Page to modify with auth integration
- `packages/frontend/src/pages/TicketTypesPage.test.tsx` — Existing tests to update
- `packages/frontend/src/store/AuthContext.tsx` — Auth token and admin check (task_07)

### Dependent Files
- `packages/frontend/src/pages/TicketTypesPage.test.tsx` — Tests must be updated to mock AuthContext

## Deliverables
- Updated `packages/frontend/src/pages/TicketTypesPage.tsx` with auth integration
- Updated `packages/frontend/src/pages/TicketTypesPage.test.tsx` with auth mocking
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for auth behavior **(REQUIRED)**

## Tests
- Unit tests:
  - [ ] TicketTypesPage includes Authorization header in GET /api/ticket-types call
  - [ ] TicketTypesPage includes Authorization header in POST call
  - [ ] TicketTypesPage includes Authorization header in PUT call
  - [ ] TicketTypesPage includes Authorization header in DELETE call
  - [ ] Admin user sees create, edit, and delete controls
  - [ ] Regular user sees ticket types in read-only mode (no create/edit/delete)
- Integration tests:
  - [ ] Full CRUD flow works with admin auth token
  - [ ] Read-only view renders correctly for regular user
  - [ ] 401 response triggers signout and redirect to /signin
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- All API calls include auth headers
- Admin users retain full CRUD functionality
- Regular users see read-only view
- 401 responses handled gracefully
