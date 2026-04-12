---
status: completed
title: Create dashboard API route
type: backend
complexity: medium
dependencies:
    - task_03
---

# Task 4: Create dashboard API route

## Overview

Create the Express route handler for `GET /api/dashboard/metrics` that exposes the dashboard service to the frontend. This is the single API endpoint that serves all dashboard data (KPIs, queue summary, and optionally trend data), protected by JWT authentication and scoped to the user's organization.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create `GET /api/dashboard/metrics` endpoint
- MUST protect the endpoint with `authMiddleware`
- MUST accept optional `period` query parameter with values "7d", "30d", "90d"
- MUST return 400 if `period` has an invalid value
- MUST return 200 with `DashboardMetrics` JSON response
- MUST return 401 when no valid JWT is provided
- MUST extract `organizationId` from the authenticated user context
- MUST mount the route in `index.ts` following the existing pattern
- MUST follow the existing error handling pattern (try/catch with next(error))
</requirements>

## Subtasks
- [ ] 4.1 Create the dashboard routes file with GET /metrics endpoint
- [ ] 4.2 Validate the `period` query parameter and return 400 for invalid values
- [ ] 4.3 Mount the dashboard routes in the main index.ts
- [ ] 4.4 Write integration tests for the endpoint

## Implementation Details

Create `packages/backend/src/routes/dashboardRoutes.ts` following the pattern from `ticketRoutes.ts`. Mount in `index.ts` as `app.use("/api/dashboard", dashboardRoutes)`. See TechSpec "API Endpoints" section for request/response specifications.

### Relevant Files
- `packages/backend/src/routes/ticketRoutes.ts` — Route pattern to follow (authMiddleware, error handling, request typing)
- `packages/backend/src/index.ts` — Where to mount the new route
- `packages/backend/src/data/authMiddleware.ts` — Authentication middleware to apply
- `packages/backend/src/data/testHelper.ts` — Test helpers for integration tests

### Dependent Files
- `packages/frontend/src/pages/DashboardPage.tsx` (task_06) — Will call this endpoint
- `packages/frontend/src/pages/TrendsTab.tsx` (task_07) — Will call this endpoint with period param

### Related ADRs
- [ADR-004: API Design — Single Metrics Endpoint with Polling Refresh](../adrs/adr-004.md) — This task implements the single endpoint design

## Deliverables
- `packages/backend/src/routes/dashboardRoutes.ts` with GET /metrics endpoint
- Updated `packages/backend/src/index.ts` with route mounting
- Integration tests with 80%+ coverage **(REQUIRED)**

## Tests
- Integration tests:
  - [ ] `GET /api/dashboard/metrics` returns 200 with correct DashboardMetrics structure
  - [ ] `GET /api/dashboard/metrics?period=7d` returns 200 with trends included
  - [ ] `GET /api/dashboard/metrics?period=30d` returns 200 with trends included
  - [ ] `GET /api/dashboard/metrics?period=90d` returns 200 with trends included
  - [ ] `GET /api/dashboard/metrics?period=invalid` returns 400 with error message
  - [ ] `GET /api/dashboard/metrics` without JWT returns 401
  - [ ] `GET /api/dashboard/metrics` returns data scoped to the authenticated user's organization
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Endpoint returns correct JSON structure
- Authentication enforced
- Invalid period parameter rejected with 400
- Route mounted and accessible at `/api/dashboard/metrics`
