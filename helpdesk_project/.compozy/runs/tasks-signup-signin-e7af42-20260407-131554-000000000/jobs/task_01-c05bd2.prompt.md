# Implementation Task: task_01.md

## Task Context

- **Title**: Database migration for multi-tenancy
- **Type**: backend
- **Complexity**: medium


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
- Current task memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin/memory/task_01.md`
- Use installed `cy-workflow-memory` before editing code and before finishing the task.
- Read both memory files before implementation. Promote durable cross-task context only to shared workflow memory.
- Keep task-local decisions, learnings, touched surfaces, and corrections in the current task memory file.


## Task Specification

---
status: pending
title: Database migration for multi-tenancy
type: backend
complexity: medium
dependencies: []
---

# Task 1: Database migration for multi-tenancy

## Overview
Create the database schema changes required for multi-tenancy support. This includes new `organizations` and `users` tables, adding `organization_id` foreign keys to existing `ticket_types` and `tickets` tables, and creating a default organization to preserve existing data. This is the foundational task that all other tasks depend on.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC "Data Models" section for exact SQL definitions
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create `organizations` table with `id` (SERIAL PRIMARY KEY) and `name` (VARCHAR(100) NOT NULL)
- MUST create `users` table with `id`, `name`, `email`, `password`, `admin` (BOOLEAN DEFAULT false), and `organization_id` (FK to organizations)
- MUST create a case-insensitive unique index on `users.email` using LOWER(email)
- MUST add `organization_id` (NOT NULL FK to organizations) to `ticket_types` table
- MUST add `organization_id` (NOT NULL FK to organizations) to `tickets` table
- MUST replace the global `ticket_types_name_lower_unique` index with an org-scoped composite index on (LOWER(name), organization_id)
- MUST create a "Default" organization and assign all existing rows to it during migration
- MUST preserve all existing data — zero data loss
</requirements>

## Subtasks
- [ ] 1.1 Create the `organizations` table
- [ ] 1.2 Create the `users` table with email unique index
- [ ] 1.3 Insert the "Default" organization for existing data migration
- [ ] 1.4 Add `organization_id` column to `ticket_types` with default org assignment, then drop default
- [ ] 1.5 Replace global name unique index with org-scoped composite index on `ticket_types`
- [ ] 1.6 Add `organization_id` column to `tickets` with default org assignment, then drop default

## Implementation Details
Update the database initialization script to include the new tables and alterations. See TechSpec "Data Models" section for exact SQL definitions and the migration strategy.

### Relevant Files
- `database/init.sql` — Current schema with `health_check`, `ticket_types`, `tickets` tables and seed data
- `packages/backend/src/data/database.ts` — pg-promise database connection configuration
- `packages/backend/src/data/testHelper.ts` — Test database utilities (truncation, connection verification)

### Dependent Files
- `packages/backend/src/services/ticketTypeService.ts` — Queries will need org scoping (task_04)
- `packages/backend/src/routes/ticketTypeRoutes.ts` — Routes will need auth middleware (task_04)
- `packages/backend/src/data/testHelper.ts` — Will need updated truncation for new tables

### Related ADRs
- [ADR-003: Default Organization Migration Strategy](adrs/adr-003.md) — Defines the strategy to create a default org and assign existing data to it

## Deliverables
- Updated `database/init.sql` with organizations and users tables
- Migration logic for existing ticket_types and tickets data
- Updated `testHelper.ts` to handle new tables in truncation
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests verifying schema constraints **(REQUIRED)**

## Tests
- Unit tests:
  - [ ] Organizations table exists with correct columns (id, name)
  - [ ] Users table exists with correct columns (id, name, email, password, admin, organization_id)
  - [ ] Users email unique index enforces case-insensitive uniqueness (inserting "Test@email.com" and "test@email.com" fails)
  - [ ] Users organization_id FK constraint rejects invalid organization references
  - [ ] ticket_types.organization_id is NOT NULL and references organizations
  - [ ] tickets.organization_id is NOT NULL and references organizations
  - [ ] Org-scoped name uniqueness allows same ticket type name in different organizations
  - [ ] Org-scoped name uniqueness prevents duplicate names within same organization
- Integration tests:
  - [ ] Default organization exists after migration
  - [ ] Existing ticket_types seed data is assigned to the default organization
  - [ ] Existing tickets seed data is assigned to the default organization
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- New tables created with correct constraints
- Existing data preserved and assigned to default organization
- No orphaned rows in ticket_types or tickets


## Task Files

- PRD directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin`
- Task file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin/task_01.md`
- Master tasks file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin/_tasks.md`
- Use these exact paths when `cy-execute-task` updates task tracking.
- Execute every explicit `Validation`, `Test Plan`, or `Testing` item from the task and supporting PRD docs.
- Update task checkboxes and task status only after implementation, verification evidence, and self-review are complete.
- Update the master tasks file only when the current task is actually complete.
- Keep tracking-only files out of automatic commits unless the repository explicitly requires them to be staged.
- Do not create an automatic commit for this run. Leave the diff ready for manual review.
