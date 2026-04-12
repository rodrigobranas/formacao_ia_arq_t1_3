---
status: completed
title: Authenticated ticket routes
type: backend
complexity: medium
dependencies:
    - task_03
---

# Task 05: Authenticated ticket routes

## Overview

Create the authenticated HTTP endpoints for operators to manage tickets: list, view detail, assign, forward, close, and add comments. All endpoints require JWT authentication and scope data to the operator's organization. Register the routes in the app entry point.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create GET /api/tickets endpoint for listing tickets with optional status query filter (200)
- MUST create GET /api/tickets/:id endpoint for ticket detail with comments, attachments, assignments (200, 404)
- MUST create POST /api/tickets/:id/assign endpoint for self-assignment (200, 400, 404)
- MUST create POST /api/tickets/:id/forward endpoint accepting userId in body (200, 400, 404)
- MUST create POST /api/tickets/:id/close endpoint (200, 400, 404)
- MUST create POST /api/tickets/:id/comments endpoint with optional attachments (201, 400, 404)
- MUST use authMiddleware on all endpoints
- MUST extract organizationId and userId from authenticated request
- MUST follow existing route error handling patterns
- MUST register ticketRoutes in index.ts
</requirements>

## Subtasks
- [ ] 5.1 Create ticketRoutes.ts with all six endpoints using authMiddleware
- [ ] 5.2 Implement status query string parsing for list endpoint
- [ ] 5.3 Register ticketRoutes in index.ts under /api/tickets
- [ ] 5.4 Write integration tests for all endpoints covering success, auth, and error cases

## Implementation Details

Create `packages/backend/src/routes/ticketRoutes.ts`. Follow patterns from `ticketTypeRoutes.ts` for auth middleware usage, error mapping, and request handling. See TechSpec 'API Endpoints > Authenticated Endpoints' section for request/response formats.

### Relevant Files
- `packages/backend/src/routes/ticketTypeRoutes.ts` — pattern reference for authenticated routes
- `packages/backend/src/data/authMiddleware.ts` — authMiddleware and AuthenticatedRequest type
- `packages/backend/src/index.ts` — route registration
- `packages/backend/src/services/ticketService.ts` (from task_03) — service functions to call

### Dependent Files
- `packages/frontend/src/pages/TicketsPage.tsx` (task_07) — will call list endpoint
- `packages/frontend/src/pages/TicketDetailPage.tsx` (task_08) — will call detail, assign, forward, close, comments endpoints

### Related ADRs
- [ADR-001: Ticket Status Workflow](../adrs/adr-001.md) — Status transitions enforced by service layer

## Deliverables
- `packages/backend/src/routes/ticketRoutes.ts` — authenticated ticket endpoints
- Updated `packages/backend/src/index.ts` — route registration
- `packages/backend/src/routes/ticketRoutes.test.ts` — integration tests **(REQUIRED)**

## Tests
- Integration tests:
  - [ ] GET /api/tickets returns 200 with list of organization tickets
  - [ ] GET /api/tickets?status=new returns only tickets with status 'new'
  - [ ] GET /api/tickets?status=new&status=assigned returns tickets with either status
  - [ ] GET /api/tickets returns empty array when no tickets exist
  - [ ] GET /api/tickets does not return tickets from other organizations
  - [ ] GET /api/tickets/:id returns 200 with full ticket detail including comments, attachments, assignments
  - [ ] GET /api/tickets/:id for non-existent ticket returns 404
  - [ ] GET /api/tickets/:id for ticket in different organization returns 404
  - [ ] POST /api/tickets/:id/assign returns 200 and changes status to 'assigned'
  - [ ] POST /api/tickets/:id/assign on already-assigned ticket returns 400
  - [ ] POST /api/tickets/:id/forward with valid userId returns 200
  - [ ] POST /api/tickets/:id/forward to same user returns 400
  - [ ] POST /api/tickets/:id/forward to user in different org returns 400
  - [ ] POST /api/tickets/:id/close returns 200 and changes status to 'closed'
  - [ ] POST /api/tickets/:id/close on non-assigned ticket returns 400
  - [ ] POST /api/tickets/:id/comments returns 201 with comment data
  - [ ] POST /api/tickets/:id/comments with attachments returns 201
  - [ ] All endpoints return 401 without Authorization header
  - [ ] All endpoints return 401 with invalid token
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- All endpoints properly authenticated
- Organization isolation enforced on all queries
- Status transitions correctly validated
