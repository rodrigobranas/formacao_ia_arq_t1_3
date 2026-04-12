# Implementation Task: task_05.md

## Task Context

- **Title**: Authenticated ticket routes
- **Type**: backend
- **Complexity**: medium
- **Dependencies**: task_03


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
- Current task memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/tickets/memory/task_05.md`
- Use installed `cy-workflow-memory` before editing code and before finishing the task.
- Read both memory files before implementation. Promote durable cross-task context only to shared workflow memory.
- Keep task-local decisions, learnings, touched surfaces, and corrections in the current task memory file.


## Task Specification

---
status: pending
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


## Task Files

- PRD directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/tickets`
- Task file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/tickets/task_05.md`
- Master tasks file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/tickets/_tasks.md`
- Use these exact paths when `cy-execute-task` updates task tracking.
- Execute every explicit `Validation`, `Test Plan`, or `Testing` item from the task and supporting PRD docs.
- Update task checkboxes and task status only after implementation, verification evidence, and self-review are complete.
- Update the master tasks file only when the current task is actually complete.
- Keep tracking-only files out of automatic commits unless the repository explicitly requires them to be staged.
- Do not create an automatic commit for this run. Leave the diff ready for manual review.
