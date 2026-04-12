---
status: completed
title: "Backend ticket type REST routes with integration tests"
type: backend
complexity: medium
dependencies:
    - task_02
---

# Task 03: Backend ticket type REST routes with integration tests

## Overview

Create the REST route handlers for ticket type CRUD operations and mount them in the Express app. The routes translate HTTP requests into service calls and service responses/errors into appropriate HTTP status codes and JSON bodies. Integration tests exercise the full request-response cycle against a real database.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create an Express Router with four endpoints: GET, POST, PUT /:id, DELETE /:id under `/api/ticket-types`
- MUST mount the router in `index.ts` at the `/api/ticket-types` path
- MUST return correct HTTP status codes: 200 (list, update), 201 (create), 204 (delete), 400 (validation), 404 (not found), 409 (in use)
- MUST return JSON error bodies with an `error` field containing a human-readable message
- MUST delegate all business logic to the service layer (no SQL or validation in routes)
- MUST update `jest.config.ts` to include the new source files in coverage collection
- MUST write integration tests using Supertest against real PostgreSQL for all endpoints and error scenarios
</requirements>

## Subtasks
- [ ] 3.1 Create `ticketTypeRoutes.ts` with an Express Router exporting the four CRUD endpoints
- [ ] 3.2 Mount the ticket type router in `index.ts` at `/api/ticket-types`
- [ ] 3.3 Map service layer errors to HTTP status codes (400, 404, 409) in route error handling
- [ ] 3.4 Update `jest.config.ts` `collectCoverageFrom` to include new source files
- [ ] 3.5 Write integration tests for all endpoints covering success and error paths

## Implementation Details

Create `backend/src/ticketTypeRoutes.ts` as an Express Router. Each route handler calls the corresponding service function from `ticketTypeService.ts`, wraps the result in the appropriate HTTP response, and catches errors to return the correct status code. See TechSpec "API Endpoints" section for the complete endpoint specifications.

The route handlers use a try/catch pattern: service functions throw typed errors (validation, not-found, in-use), and the route maps each error type to its HTTP status code. Mount in `index.ts` with `app.use("/api/ticket-types", ticketTypeRoutes)`.

### Relevant Files
- `backend/src/ticketTypeService.ts` — Service functions to call from route handlers (created in task_02)
- `backend/src/index.ts` — Express app where routes are mounted (line 10, after middleware setup)
- `backend/src/health.test.ts` — Reference for existing test patterns (Supertest usage)
- `backend/src/testHelper.ts` — Test helper for DB setup/teardown (created in task_01)
- `backend/jest.config.ts` — Coverage config to update (currently only covers `src/index.ts`)

### Dependent Files
- `frontend/src/pages/TicketTypesPage.tsx` (task_05) — Will call these API endpoints via fetch

### Related ADRs
- [ADR-002: Layered Backend Organization](adrs/adr-002.md) — Routes delegate to service; no business logic in route handlers
- [ADR-004: Integration Tests with Real Database](adrs/adr-004.md) — Tests run against real PostgreSQL

## Deliverables
- `backend/src/ticketTypeRoutes.ts` with four CRUD route handlers
- Modified `backend/src/index.ts` mounting the new router
- Updated `backend/jest.config.ts` with expanded coverage collection
- Integration test file with comprehensive endpoint tests
- Integration tests with 80%+ coverage **(REQUIRED)**

## Tests
- Integration tests:
  - [ ] GET `/api/ticket-types` returns 200 with array of ticket types in alphabetical order
  - [ ] GET `/api/ticket-types` returns 200 with empty array when no types exist
  - [ ] POST `/api/ticket-types` with valid body returns 201 with created ticket type
  - [ ] POST `/api/ticket-types` with missing name returns 400 with error message
  - [ ] POST `/api/ticket-types` with name exceeding 50 chars returns 400
  - [ ] POST `/api/ticket-types` with description exceeding 255 chars returns 400
  - [ ] POST `/api/ticket-types` with duplicate name (case-insensitive) returns 400
  - [ ] PUT `/api/ticket-types/:id` with valid body returns 200 with updated ticket type
  - [ ] PUT `/api/ticket-types/:id` for non-existent id returns 404
  - [ ] PUT `/api/ticket-types/:id` with duplicate name returns 400
  - [ ] DELETE `/api/ticket-types/:id` for unused type returns 204
  - [ ] DELETE `/api/ticket-types/:id` for type in use returns 409
  - [ ] DELETE `/api/ticket-types/:id` for non-existent id returns 404
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- All four REST endpoints respond with correct status codes and JSON bodies
- Route handlers contain no business logic — all logic is in the service layer
- Existing `/health` endpoint continues to work after route mounting changes
