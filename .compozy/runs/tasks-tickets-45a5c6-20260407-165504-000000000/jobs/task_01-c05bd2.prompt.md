# Implementation Task: task_01.md

## Task Context

- **Title**: Database schema for ticket management
- **Type**: infra
- **Complexity**: medium


<required_skills>
- `cy-workflow-memory`: required when workflow memory paths are provided for this task
- `cy-execute-task`: required end-to-end workflow for a PRD task
- `cy-final-verify`: required before any completion claim or automatic commit
</required_skills>

<critical>
- Use installed `cy-workflow-memory` before editing code when workflow memory paths are provided below.
- Use installed `cy-execute-task` as the execution workflow for this task.
- Read `AGENTS.md`, `CLAUDE.md`, and the PRD documents under `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/tickets` before editing code.
- Treat the task specification below plus the supporting PRD documents, especially `_techspec.md` and `_tasks.md`, as the source of truth.
- Keep scope tight to this task and record meaningful follow-up work instead of expanding scope silently.
- Use installed `cy-final-verify` before any completion claim or automatic commit.
- Automatic commits are disabled for this run (`--auto-commit=false`).
</critical>

## Workflow Memory

- Memory directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/tickets/memory`
- Shared workflow memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/tickets/memory/MEMORY.md`
- Current task memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/tickets/memory/task_01.md`
- Use installed `cy-workflow-memory` before editing code and before finishing the task.
- Read both memory files before implementation. Promote durable cross-task context only to shared workflow memory.
- Keep task-local decisions, learnings, touched surfaces, and corrections in the current task memory file.


## Task Specification

---
status: pending
title: Database schema for ticket management
type: infra
complexity: medium
dependencies: []
---

# Task 01: Database schema for ticket management

## Overview

Extend the PostgreSQL schema in `database/init.sql` to support the full ticket management feature. This includes adding a `slug` column to organizations, expanding the existing `tickets` table with customer info and status fields, and creating three new tables for comments, attachments, and assignment history. The test helper must also be updated to truncate the new tables.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST add `slug VARCHAR(100) UNIQUE NOT NULL` column to organizations table
- MUST extend tickets table with: code, status (default 'new'), name, email, phone, description, assigned_to_id, created_at, updated_at columns
- MUST make ticket_type_id nullable (currently NOT NULL) since ticket type is optional
- MUST create ticket_comments table with ticket_id, user_id, content, created_at
- MUST create ticket_attachments table with ticket_id, ticket_comment_id (nullable), filename, content_type, content (TEXT), created_at
- MUST create ticket_assignments table with ticket_id, assigned_to_id, assigned_by_id, created_at
- MUST add unique index on tickets.code
- MUST update default organization seed data to include a slug value
- MUST update testHelper.ts to truncate new tables in correct FK order
</requirements>

## Subtasks
- [ ] 1.1 Add slug column to organizations table with unique constraint
- [ ] 1.2 Extend tickets table with all new columns per TechSpec 'Data Models' section
- [ ] 1.3 Create ticket_comments table with foreign keys to tickets and users
- [ ] 1.4 Create ticket_attachments table with foreign keys to tickets and ticket_comments
- [ ] 1.5 Create ticket_assignments table with foreign keys to tickets and users
- [ ] 1.6 Update default seed data (organization slug, adjust ticket inserts for nullable ticket_type_id)
- [ ] 1.7 Update testHelper.ts truncation to include new tables in correct dependency order

## Implementation Details

Modify `database/init.sql` to update existing table definitions and add new ones. See TechSpec 'Data Models' section for exact column definitions, types, and constraints.

Update `packages/backend/src/data/testHelper.ts` to truncate ticket_attachments, ticket_comments, ticket_assignments, and tickets (in that order due to FK constraints) before truncating ticket_types, users, and organizations.

### Relevant Files
- `database/init.sql` — current schema definitions to modify
- `packages/backend/src/data/testHelper.ts` — truncation logic to update

### Dependent Files
- `packages/backend/src/services/ticketTypeService.ts` — queries tickets table (ticket_type_id FK change)
- `packages/backend/src/routes/ticketTypeRoutes.test.ts` — tests may be affected by schema changes
- `packages/backend/src/services/authService.ts` — signup creates organizations (slug field needed)

### Related ADRs
- [ADR-001: Ticket Status Workflow](../adrs/adr-001.md) — Status column uses values: new, assigned, closed
- [ADR-002: Public Endpoint Routing via Organization Slug](../adrs/adr-002.md) — Slug column on organizations table
- [ADR-003: File Attachments as Base64 in JSON Payloads](../adrs/adr-003.md) — Attachment content stored as TEXT (base64)

## Deliverables
- Updated `database/init.sql` with all schema changes
- Updated `packages/backend/src/data/testHelper.ts` with new table truncation
- Integration tests verifying existing tests still pass with schema changes **(REQUIRED)**
- Unit tests not applicable for schema-only changes; verify via existing test suite **(REQUIRED)**

## Tests
- Integration tests:
  - [ ] All existing backend tests pass with the updated schema (no regressions)
  - [ ] testHelper.truncateTables() successfully cleans all tables including new ones
  - [ ] Default seed data inserts correctly (organization with slug, ticket types)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Database initializes cleanly with `docker compose down -v && docker compose up`
- All existing tests pass without modification (except testHelper)


## Task Files

- PRD directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/tickets`
- Task file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/tickets/task_01.md`
- Master tasks file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/tickets/_tasks.md`
- Use these exact paths when `cy-execute-task` updates task tracking.
- Execute every explicit `Validation`, `Test Plan`, or `Testing` item from the task and supporting PRD docs.
- Update task checkboxes and task status only after implementation, verification evidence, and self-review are complete.
- Update the master tasks file only when the current task is actually complete.
- Keep tracking-only files out of automatic commits unless the repository explicitly requires them to be staged.
- Do not create an automatic commit for this run. Leave the diff ready for manual review.
