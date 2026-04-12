---
status: completed
title: Create dashboard types (backend + frontend)
type: backend
complexity: low
dependencies: []
---

# Task 2: Create dashboard types (backend + frontend)

## Overview

Define the TypeScript interfaces for the dashboard metrics data structures shared between backend and frontend. These types establish the contract for the single `GET /api/dashboard/metrics` endpoint response, ensuring type safety across the stack.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST define `DashboardKpis`, `OldestTicket`, `QueueItem`, `TrendDataPoint`, `ResolutionTrendPoint`, `TicketsByTypePoint`, and `DashboardMetrics` interfaces on the backend
- MUST mirror the same interfaces on the frontend in `types.ts`
- MUST follow existing naming conventions (camelCase for properties, PascalCase for interfaces)
- MUST NOT use `any` type anywhere
- MUST match the response structure defined in TechSpec "API Endpoints" section
</requirements>

## Subtasks
- [x] 2.1 Create backend dashboard type definitions
- [x] 2.2 Add frontend dashboard type definitions to the existing types file
- [x] 2.3 Write tests to verify type exports are valid

## Implementation Details

Backend types go in a new file within the services directory, following the pattern where types are co-located with the service that uses them. Frontend types are added to the existing `types.ts` file. See TechSpec "Core Interfaces" section for the complete interface definitions.

### Relevant Files
- `packages/frontend/src/types/types.ts` — Existing frontend types file to extend
- `packages/backend/src/services/ticketService.ts` — Pattern for how backend types are defined alongside services

### Dependent Files
- `packages/backend/src/services/dashboardService.ts` (task_03) — Will import backend types
- `packages/backend/src/routes/dashboardRoutes.ts` (task_04) — Will use types for response typing
- `packages/frontend/src/pages/DashboardPage.tsx` (task_06) — Will import frontend types
- `packages/frontend/src/pages/TrendsTab.tsx` (task_07) — Will import frontend types

## Deliverables
- Backend dashboard type definitions file
- Frontend dashboard types added to `types.ts`
- Unit tests with 80%+ coverage **(REQUIRED)**

## Tests
- Unit tests:
  - [x] Verify `DashboardMetrics` interface can be instantiated with valid data (compile-time check via test fixtures)
  - [x] Verify `DashboardMetrics` with `trends` undefined is valid (optional field)
  - [x] Verify `OldestTicket` can be null in `DashboardKpis` (nullable field)
  - [x] Verify `avgResolutionTimeHours` can be null in `DashboardKpis` (nullable field)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Types compile without errors in both backend and frontend
- No use of `any` type
