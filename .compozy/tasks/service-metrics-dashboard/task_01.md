---
status: completed
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
- [x] 1.1 Add three composite indexes to the database schema
- [x] 1.2 Verify indexes are created successfully on a local database
- [x] 1.3 Write a test that validates the indexes exist in the database

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
  - [x] Verify `idx_tickets_org_status` index exists in the database after running init.sql
  - [x] Verify `idx_tickets_org_created` index exists in the database after running init.sql
  - [x] Verify `idx_tickets_org_status_created` index exists in the database after running init.sql
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All three indexes are created in the database schema
- All tests passing
- Test coverage >=80%
- `EXPLAIN ANALYZE` on a sample aggregation query shows index usage (manual verification)
