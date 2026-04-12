# Implementation Task: task_07.md

## Task Context

- **Title**: Operator ticket list page
- **Type**: frontend
- **Complexity**: medium
- **Dependencies**: task_05


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
- Current task memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/tickets/memory/task_07.md`
- Use installed `cy-workflow-memory` before editing code and before finishing the task.
- Read both memory files before implementation. Promote durable cross-task context only to shared workflow memory.
- Keep task-local decisions, learnings, touched surfaces, and corrections in the current task memory file.


## Task Specification

---
status: pending
title: Operator ticket list page
type: frontend
complexity: medium
dependencies:
  - task_05
---

# Task 07: Operator ticket list page

## Overview

Create the operator-facing ticket list page that displays all tickets for the organization with status filtering and navigation to ticket detail. This page is accessible to all authenticated users and must be added to the sidebar navigation and router.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create TicketsPage.tsx displaying a table of tickets: code, ticket type, customer name, status, assignee, creation date
- MUST fetch tickets from GET /api/tickets on page load
- MUST support filtering by status via query parameter (new, assigned, closed)
- MUST highlight 'new' (unassigned) tickets prominently in the list
- MUST link each ticket row to the detail page (/tickets/:id)
- MUST add "Tickets" link to the sidebar navigation in App.tsx (main section, not settings)
- MUST add /tickets route to router.tsx inside ProtectedRoute
- MUST use Shadcn Table component and Tailwind for styling
- MUST handle loading and empty states
</requirements>

## Subtasks
- [ ] 7.1 Create TicketsPage.tsx with ticket table, status filter, and navigation to detail
- [ ] 7.2 Add /tickets route to router.tsx inside ProtectedRoute
- [ ] 7.3 Add "Tickets" navigation item to sidebar in App.tsx
- [ ] 7.4 Write component tests for the ticket list page

## Implementation Details

Create page in `packages/frontend/src/pages/`. Follow patterns from `TicketTypesPage.tsx` for table rendering and API fetching. Add route in `packages/frontend/src/router.tsx` inside the ProtectedRoute. Add sidebar link in `packages/frontend/src/App.tsx`. See TechSpec 'API Endpoints > Authenticated Endpoints' for GET /api/tickets response format.

### Relevant Files
- `packages/frontend/src/pages/TicketTypesPage.tsx` — pattern reference for table pages with API fetching
- `packages/frontend/src/App.tsx` — sidebar navigation to modify
- `packages/frontend/src/router.tsx` — route definitions to modify
- `packages/frontend/src/components/ui/table.tsx` — Shadcn table component

### Dependent Files
- `packages/frontend/src/App.tsx` — new sidebar navigation item
- `packages/frontend/src/router.tsx` — new route entry

## Deliverables
- `packages/frontend/src/pages/TicketsPage.tsx` — operator ticket list
- Updated `packages/frontend/src/App.tsx` — sidebar navigation
- Updated `packages/frontend/src/router.tsx` — ticket list route
- `packages/frontend/src/pages/TicketsPage.test.tsx` — component tests **(REQUIRED)**

## Tests
- Unit tests:
  - [ ] TicketsPage renders table with ticket data from API
  - [ ] TicketsPage displays loading state while fetching
  - [ ] TicketsPage displays empty state when no tickets exist
  - [ ] TicketsPage filters tickets by status when filter is applied
  - [ ] TicketsPage highlights tickets with status 'new'
  - [ ] TicketsPage renders ticket code, name, type, status, assignee, date columns
  - [ ] TicketsPage links each row to /tickets/:id
  - [ ] TicketsPage handles API error gracefully
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Ticket list loads and displays correctly
- Status filter works as expected
- Navigation from sidebar and to ticket detail works
- New tickets are visually distinguishable


## Task Files

- PRD directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/tickets`
- Task file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/tickets/task_07.md`
- Master tasks file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/tickets/_tasks.md`
- Use these exact paths when `cy-execute-task` updates task tracking.
- Execute every explicit `Validation`, `Test Plan`, or `Testing` item from the task and supporting PRD docs.
- Update task checkboxes and task status only after implementation, verification evidence, and self-review are complete.
- Update the master tasks file only when the current task is actually complete.
- Keep tracking-only files out of automatic commits unless the repository explicitly requires them to be staged.
- Do not create an automatic commit for this run. Leave the diff ready for manual review.
