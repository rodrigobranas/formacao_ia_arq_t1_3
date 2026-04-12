---
status: completed
title: "Backend ticket type service layer"
type: backend
complexity: medium
dependencies:
    - task_01
---

# Task 02: Backend ticket type service layer

## Overview

Create the service layer that encapsulates all business logic and database queries for ticket type CRUD operations. This module is the single point of data access for ticket types, called by the route handlers (task_03). It validates inputs, executes SQL queries via pg-promise, and translates database errors into meaningful application errors.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST export a `TicketType` interface with `id` (number), `name` (string), `description` (string | null)
- MUST export `CreateTicketTypeInput` and `UpdateTicketTypeInput` interfaces as defined in TechSpec "Core Interfaces"
- MUST implement `list()` returning all ticket types ordered alphabetically by name
- MUST implement `create(input)` that validates name (required, max 50 chars, case-insensitive unique) and description (optional, max 255 chars), inserts a row, and returns the created entity
- MUST implement `update(id, input)` with the same validation as create, excluding the current record from uniqueness check
- MUST implement `remove(id)` that deletes a ticket type only if it is not in use (checked via `isInUse`)
- MUST implement `isInUse(id)` that checks if any rows in the `tickets` table reference the given ticket type
- MUST throw descriptive errors for validation failures, not-found, and in-use conditions
</requirements>

## Subtasks
- [ ] 2.1 Create `ticketTypeService.ts` with TypeScript interfaces for `TicketType`, `CreateTicketTypeInput`, `UpdateTicketTypeInput`
- [ ] 2.2 Implement `list()` function with alphabetical ordering
- [ ] 2.3 Implement `create()` function with input validation and case-insensitive uniqueness check
- [ ] 2.4 Implement `update()` function with validation and uniqueness check excluding current record
- [ ] 2.5 Implement `remove()` function with in-use protection via `isInUse()` check
- [ ] 2.6 Write integration tests for all service functions against real PostgreSQL

## Implementation Details

Create `backend/src/ticketTypeService.ts` as a module exporting async functions. Each function uses the `db` instance from `database.ts` to execute parameterized SQL queries. See TechSpec "Core Interfaces" section for the complete interface definitions and "Data Models" section for the SQL table structure.

Validation is performed in the service layer before database operations. The case-insensitive uniqueness check uses `SELECT ... WHERE LOWER(name) = LOWER($1)` to avoid relying solely on the DB constraint for user-friendly error messages.

### Relevant Files
- `backend/src/database.ts` — pg-promise `db` instance to import for queries
- `database/init.sql` — Table definitions referenced by SQL queries
- `backend/src/testHelper.ts` — Test helper created in task_01 for integration test setup

### Dependent Files
- `backend/src/ticketTypeRoutes.ts` (task_03) — Will import and call these service functions

### Related ADRs
- [ADR-002: Layered Backend Organization](adrs/adr-002.md) — Establishes the service layer pattern
- [ADR-005: Forward-Declare Tickets Table for FK Delete Protection](adrs/adr-005.md) — Explains the `isInUse` check against the tickets table

## Deliverables
- `backend/src/ticketTypeService.ts` with all CRUD functions and type exports
- Integration tests for all service functions against real PostgreSQL
- Integration tests with 80%+ coverage **(REQUIRED)**

## Tests
- Integration tests:
  - [ ] `list()` returns seeded ticket types in alphabetical order
  - [ ] `list()` returns empty array after truncation
  - [ ] `create()` with valid name and description returns the created ticket type with an `id`
  - [ ] `create()` with empty name throws a validation error
  - [ ] `create()` with name exceeding 50 characters throws a validation error
  - [ ] `create()` with description exceeding 255 characters throws a validation error
  - [ ] `create()` with duplicate name (case-insensitive) throws a uniqueness error
  - [ ] `update()` with valid data returns the updated ticket type
  - [ ] `update()` for non-existent id throws a not-found error
  - [ ] `update()` to a duplicate name (excluding self) throws a uniqueness error
  - [ ] `update()` to the same name (own record, different case) succeeds
  - [ ] `remove()` for an unused ticket type deletes it successfully
  - [ ] `remove()` for a ticket type in use by a ticket throws an in-use error
  - [ ] `remove()` for a non-existent id throws a not-found error
  - [ ] `isInUse()` returns false when no tickets reference the type
  - [ ] `isInUse()` returns true when at least one ticket references the type
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- All five service functions (`list`, `create`, `update`, `remove`, `isInUse`) work correctly against real PostgreSQL
- Validation errors are descriptive and distinguish between empty name, too-long name, duplicate name, not-found, and in-use
