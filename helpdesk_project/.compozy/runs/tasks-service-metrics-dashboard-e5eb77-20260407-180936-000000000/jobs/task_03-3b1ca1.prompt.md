# Implementation Task: task_03.md

## Task Context

- **Title**: Implement dashboard service with SQL aggregation
- **Type**: backend
- **Complexity**: high
- **Dependencies**: task_01, task_02


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
- Current task memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/service-metrics-dashboard/memory/task_03.md`
- Use installed `cy-workflow-memory` before editing code and before finishing the task.
- Read both memory files before implementation. Promote durable cross-task context only to shared workflow memory.
- Keep task-local decisions, learnings, touched surfaces, and corrections in the current task memory file.


## Task Specification

---
status: pending
title: Implement dashboard service with SQL aggregation
type: backend
complexity: high
dependencies:
  - task_01
  - task_02
---

# Task 3: Implement dashboard service with SQL aggregation

## Overview

Implement the core dashboard service that computes all KPIs, queue summary, and trend data via on-the-fly SQL aggregation queries against the existing `tickets` table. This is the data engine behind the entire dashboard, providing real-time metrics scoped to the authenticated user's organization.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement `getDashboardMetrics(organizationId, period?)` as the main entry point
- MUST compute all 6 KPIs: openTickets, unassignedTickets, oldestWaitingTicket, closedToday, avgResolutionTimeHours, newToday
- MUST return queue summary limited to 15 tickets sorted by created_at ascending (oldest first)
- MUST include joined data: assigned agent name (from users table), ticket type name (from ticket_types table)
- MUST compute trend data only when `period` parameter is provided
- MUST support period values: "7d", "30d", "90d"
- MUST scope all queries by `organization_id` for multi-tenancy isolation
- MUST return `null` for `avgResolutionTimeHours` when no closed tickets exist
- MUST return `null` for `oldestWaitingTicket` when no open tickets exist
- MUST use pg-promise query patterns consistent with the existing codebase
- MUST include `refreshedAt` ISO timestamp in the response
</requirements>

## Subtasks
- [ ] 3.1 Implement KPI aggregation queries (open, unassigned, oldest, closed today, avg resolution, new today)
- [ ] 3.2 Implement queue summary query with joins to users and ticket_types tables
- [ ] 3.3 Implement trend data queries (volume by date, resolution time by date, count by type)
- [ ] 3.4 Implement main `getDashboardMetrics` function that orchestrates all queries
- [ ] 3.5 Write unit tests with stubbed database for all KPI computations
- [ ] 3.6 Write integration tests with real database for end-to-end query validation

## Implementation Details

Create `packages/backend/src/services/dashboardService.ts` following the existing service pattern from `ticketService.ts`. See TechSpec "API Endpoints" section for the complete SQL query patterns. The service should use `db.one()` for single-value KPIs, `db.oneOrNone()` for nullable results, and `db.manyOrNone()` for queue and trend data.

### Relevant Files
- `packages/backend/src/services/ticketService.ts` — Service pattern to follow (function exports, db usage, error handling)
- `packages/backend/src/data/database.ts` — Database connection import
- `packages/backend/src/data/testHelper.ts` — Test database helpers for integration tests
- `database/init.sql` — Schema reference for table structures and column names

### Dependent Files
- `packages/backend/src/routes/dashboardRoutes.ts` (task_04) — Will import and call this service

### Related ADRs
- [ADR-003: Metrics Data Strategy — On-the-fly SQL Aggregation](../adrs/adr-003.md) — This task implements the on-the-fly SQL aggregation approach
- [ADR-004: API Design — Single Metrics Endpoint](../adrs/adr-004.md) — The service returns all data for a single endpoint

## Deliverables
- `packages/backend/src/services/dashboardService.ts` with all aggregation functions
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests against a real database **(REQUIRED)**

## Tests
- Unit tests:
  - [ ] `getKpis` returns all 6 KPIs with correct values when tickets exist
  - [ ] `getKpis` returns zeros and nulls when no tickets exist
  - [ ] `getKpis` returns `null` for `avgResolutionTimeHours` when no closed tickets exist
  - [ ] `getKpis` returns `null` for `oldestWaitingTicket` when no open tickets exist
  - [ ] `getQueueSummary` returns tickets sorted by created_at ascending
  - [ ] `getQueueSummary` limits results to 15 items
  - [ ] `getQueueSummary` includes joined agent name and ticket type name
  - [ ] `getQueueSummary` returns "null" for assignedToName when unassigned
  - [ ] `getTrends` returns volume grouped by date for 7d period
  - [ ] `getTrends` returns resolution time grouped by date
  - [ ] `getTrends` returns ticket counts grouped by type name
  - [ ] `getDashboardMetrics` excludes trends when period is not provided
  - [ ] `getDashboardMetrics` includes trends when period is "7d"
- Integration tests:
  - [ ] Full metrics query against database with seeded tickets returns correct KPI values
  - [ ] Multi-tenancy isolation: metrics for org A do not include org B tickets
  - [ ] Trend data correctly groups by date over a 7-day range with seeded data
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- All 6 KPIs computed correctly with edge cases handled
- Queue returns correct sorted and joined data
- Trend data groups correctly by date
- Multi-tenancy isolation verified


## Task Files

- PRD directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/service-metrics-dashboard`
- Task file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/service-metrics-dashboard/task_03.md`
- Master tasks file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/service-metrics-dashboard/_tasks.md`
- Use these exact paths when `cy-execute-task` updates task tracking.
- Execute every explicit `Validation`, `Test Plan`, or `Testing` item from the task and supporting PRD docs.
- Update task checkboxes and task status only after implementation, verification evidence, and self-review are complete.
- Update the master tasks file only when the current task is actually complete.
- Keep tracking-only files out of automatic commits unless the repository explicitly requires them to be staged.
- Do not create an automatic commit for this run. Leave the diff ready for manual review.
