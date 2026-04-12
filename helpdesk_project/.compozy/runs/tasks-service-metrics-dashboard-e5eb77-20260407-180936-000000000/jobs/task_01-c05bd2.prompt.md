# Implementation Task: task_01.md

## Task Context

- **Title**: Add database indexes for metrics queries
- **Type**: infra
- **Complexity**: low


<required_skills>
- `cy-workflow-memory`: required when workflow memory paths are provided for this task
- `cy-execute-task`: required end-to-end workflow for a PRD task
- `cy-final-verify`: required before any completion claim or automatic commit
</required_skills>

<critical>
- Use installed `cy-workflow-memory` before editing code when workflow memory paths are provided below.
- Use installed `cy-execute-task` as the execution workflow for this task.
- Read `AGENTS.md`, `CLAUDE.md`, and the PRD documents under `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/service-metrics-dashboard` before editing code.
- Treat the task specification below plus the supporting PRD documents, especially `_techspec.md` and `_tasks.md`, as the source of truth.
- Keep scope tight to this task and record meaningful follow-up work instead of expanding scope silently.
- Use installed `cy-final-verify` before any completion claim or automatic commit.
- Automatic commits are disabled for this run (`--auto-commit=false`).
</critical>

## Workflow Memory

- Memory directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/service-metrics-dashboard/memory`
- Shared workflow memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/service-metrics-dashboard/memory/MEMORY.md`
- Current task memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/service-metrics-dashboard/memory/task_01.md`
- Use installed `cy-workflow-memory` before editing code and before finishing the task.
- Read both memory files before implementation. Promote durable cross-task context only to shared workflow memory.
- Keep task-local decisions, learnings, touched surfaces, and corrections in the current task memory file.


## Task Specification

---
status: pending
title: Add database indexes for metrics queries
type: infra
complexity: low
dependencies: []
---

# Task 1: Add database indexes for metrics queries

## Overview

Add composite indexes to the `tickets` table to ensure efficient performance of the aggregation queries used by the dashboard service. Without these indexes, `COUNT`, `AVG`, and `GROUP BY` queries will require full table scans as ticket volume grows.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST add a composite index on `(organization_id, status)` to support KPI count queries
- MUST add a composite index on `(organization_id, created_at)` to support trend grouping queries
- MUST add a composite index on `(organization_id, status, created_at)` to support filtered time-range queries
- MUST be additive changes only — no modifications to existing columns or constraints
- MUST use `CREATE INDEX IF NOT EXISTS` to be idempotent
</requirements>

## Subtasks
- [ ] 1.1 Add three composite indexes to the database schema
- [ ] 1.2 Verify indexes are created successfully on a local database
- [ ] 1.3 Write a test that validates the indexes exist in the database

## Implementation Details

Add the index definitions to `database/init.sql` after the existing table and index definitions. See TechSpec "Data Models" section for the exact index specifications.

### Relevant Files
- `database/init.sql` — Database schema where indexes must be added

### Dependent Files
- `packages/backend/src/services/dashboardService.ts` (task_03) — Will rely on these indexes for query performance

### Related ADRs
- [ADR-003: Metrics Data Strategy — On-the-fly SQL Aggregation](../adrs/adr-003.md) — Indexes are the primary mitigation for the on-the-fly aggregation approach

## Deliverables
- Three new composite indexes added to `database/init.sql`
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration test verifying indexes exist in the database **(REQUIRED)**

## Tests
- Integration tests:
  - [ ] Verify `idx_tickets_org_status` index exists in the database after running init.sql
  - [ ] Verify `idx_tickets_org_created` index exists in the database after running init.sql
  - [ ] Verify `idx_tickets_org_status_created` index exists in the database after running init.sql
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All three indexes are created in the database schema
- All tests passing
- Test coverage >=80%
- `EXPLAIN ANALYZE` on a sample aggregation query shows index usage (manual verification)


## Task Files

- PRD directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/service-metrics-dashboard`
- Task file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/service-metrics-dashboard/task_01.md`
- Master tasks file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/service-metrics-dashboard/_tasks.md`
- Use these exact paths when `cy-execute-task` updates task tracking.
- Execute every explicit `Validation`, `Test Plan`, or `Testing` item from the task and supporting PRD docs.
- Update task checkboxes and task status only after implementation, verification evidence, and self-review are complete.
- Update the master tasks file only when the current task is actually complete.
- Keep tracking-only files out of automatic commits unless the repository explicitly requires them to be staged.
- Do not create an automatic commit for this run. Leave the diff ready for manual review.
