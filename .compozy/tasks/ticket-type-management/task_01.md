---
status: completed
title: "Database schema, seed data, and test helper"
type: infra
complexity: low
dependencies: []
---

# Task 01: Database schema, seed data, and test helper

## Overview

Extend the PostgreSQL schema with the `ticket_types` table (the core entity for this feature) and a minimal `tickets` table (forward-declared for FK delete protection). Seed the four default ticket types. Create a test database helper for integration tests used by subsequent backend tasks.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create `ticket_types` table with `id` (SERIAL PK), `name` (VARCHAR(50) NOT NULL), `description` (VARCHAR(255) nullable)
- MUST enforce case-insensitive uniqueness on `ticket_types.name` via a unique index on `LOWER(name)`
- MUST create a minimal `tickets` table with `id` (SERIAL PK) and `ticket_type_id` (INTEGER NOT NULL FK referencing `ticket_types(id)`)
- MUST insert four seed rows matching the PRD defaults: Dúvida, Inconsistência, Sugestão, Customização with their Portuguese descriptions
- MUST create a test database helper that connects to the real PostgreSQL instance and provides table truncation between tests
- MUST preserve the existing `health_check` table in `init.sql`
</requirements>

## Subtasks
- [ ] 1.1 Add `ticket_types` table definition with case-insensitive unique index to `database/init.sql`
- [ ] 1.2 Add minimal `tickets` table definition with FK reference to `database/init.sql`
- [ ] 1.3 Add seed INSERT statements for the four default ticket types to `database/init.sql`
- [ ] 1.4 Create a backend test helper module that connects to PostgreSQL and truncates tables for test isolation
- [ ] 1.5 Verify schema by running `make db:reset` and confirming tables and seed data exist
- [ ] 1.6 Write a smoke test that verifies the test helper connects and truncates successfully

## Implementation Details

Extend `database/init.sql` (currently only contains the `health_check` table) with new CREATE TABLE and INSERT statements. The case-insensitive unique constraint uses `CREATE UNIQUE INDEX ... ON ticket_types (LOWER(name))`.

The test helper (`backend/src/testHelper.ts`) initializes a pg-promise connection (reusing the same config from `database.ts`) and exports a `truncateTables` function. See TechSpec "Testing Approach" section for the integration test strategy.

### Relevant Files
- `database/init.sql` — Current schema file to extend with new tables and seed data
- `backend/src/database.ts` — Existing pg-promise connection config; test helper reuses this pattern
- `docker-compose.yml` — PostgreSQL container config; `init.sql` is mounted as init script

### Dependent Files
- `backend/src/ticketTypeService.ts` (task_02) — Will query the tables created here
- `backend/src/ticketTypeRoutes.test.ts` (task_03) — Will use the test helper created here

### Related ADRs
- [ADR-004: Integration Tests with Real Database](adrs/adr-004.md) — Motivates the test helper creation
- [ADR-005: Forward-Declare Tickets Table for FK Delete Protection](adrs/adr-005.md) — Explains why the minimal tickets table exists

## Deliverables
- Extended `database/init.sql` with `ticket_types`, `tickets` tables, and seed data
- `backend/src/testHelper.ts` with DB connection and truncation utility
- Smoke test verifying the test helper works
- Integration tests with 80%+ coverage **(REQUIRED)**

## Tests
- Integration tests:
  - [ ] Test helper connects to PostgreSQL successfully
  - [ ] `truncateTables` clears all rows from `ticket_types` and `tickets`
  - [ ] After `make db:reset`, `ticket_types` table contains exactly 4 seeded rows
  - [ ] Seeded rows match expected names: Dúvida, Inconsistência, Sugestão, Customização
  - [ ] `tickets.ticket_type_id` FK constraint rejects invalid references (INSERT with non-existent ticket_type_id fails)
  - [ ] Case-insensitive unique index prevents duplicate names (INSERT "dúvida" after "Dúvida" fails)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- `make db:reset` creates both tables and seeds 4 default ticket types
- FK constraint between `tickets` and `ticket_types` is enforced
- Case-insensitive uniqueness on `ticket_types.name` is enforced
- Test helper can be imported and used by subsequent task tests
