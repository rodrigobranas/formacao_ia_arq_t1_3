# Implementation Task: task_03.md

## Task Context

- **Title**: Backend ticket type REST routes with integration tests
- **Type**: backend
- **Complexity**: medium
- **Dependencies**: task_02


<required_skills>
- `cy-workflow-memory`: required when workflow memory paths are provided for this task
- `cy-execute-task`: required end-to-end workflow for a PRD task
- `cy-final-verify`: required before any completion claim or automatic commit
</required_skills>

<critical>
- Use installed `cy-workflow-memory` before editing code when workflow memory paths are provided below.
- Use installed `cy-execute-task` as the execution workflow for this task.
- Read `AGENTS.md`, `CLAUDE.md`, and the PRD documents under `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/ticket-type-management` before editing code.
- Treat the task specification below plus the supporting PRD documents, especially `_techspec.md` and `_tasks.md`, as the source of truth.
- Keep scope tight to this task and record meaningful follow-up work instead of expanding scope silently.
- Use installed `cy-final-verify` before any completion claim or automatic commit.
- Automatic commits are disabled for this run (`--auto-commit=false`).
</critical>

## Workflow Memory

- Memory directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/ticket-type-management/memory`
- Shared workflow memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/ticket-type-management/memory/MEMORY.md`
- Current task memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/ticket-type-management/memory/task_03.md`
- Use installed `cy-workflow-memory` before editing code and before finishing the task.
- Read both memory files before implementation. Promote durable cross-task context only to shared workflow memory.
- Keep task-local decisions, learnings, touched surfaces, and corrections in the current task memory file.


## Task Specification

---
status: pending
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


## Task Files

- PRD directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/ticket-type-management`
- Task file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/ticket-type-management/task_03.md`
- Master tasks file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/ticket-type-management/_tasks.md`
- Use these exact paths when `cy-execute-task` updates task tracking.
- Execute every explicit `Validation`, `Test Plan`, or `Testing` item from the task and supporting PRD docs.
- Update task checkboxes and task status only after implementation, verification evidence, and self-review are complete.
- Update the master tasks file only when the current task is actually complete.
- Keep tracking-only files out of automatic commits unless the repository explicitly requires them to be staged.
- Do not create an automatic commit for this run. Leave the diff ready for manual review.
