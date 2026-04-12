# Implementation Task: task_08.md

## Task Context

- **Title**: Operator ticket detail page
- **Type**: frontend
- **Complexity**: high
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
- Current task memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/tickets/memory/task_08.md`
- Use installed `cy-workflow-memory` before editing code and before finishing the task.
- Read both memory files before implementation. Promote durable cross-task context only to shared workflow memory.
- Keep task-local decisions, learnings, touched surfaces, and corrections in the current task memory file.


## Task Specification

---
status: pending
title: Operator ticket detail page
type: frontend
complexity: high
dependencies:
  - task_05
---

# Task 08: Operator ticket detail page

## Overview

Create the operator-facing ticket detail page showing the full ticket information, chronological timeline (assignments, comments), file attachments, and action buttons for assign, forward, close, and add comment. This is the most complex frontend page, combining read and write operations with a rich interactive UI.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create TicketDetailPage.tsx that fetches and displays full ticket detail from GET /api/tickets/:id
- MUST display ticket metadata: code, status, customer name, email, phone, description, ticket type, assignee, dates
- MUST display chronological timeline combining assignments and comments
- MUST display file attachments as downloadable links (for both ticket-level and comment-level attachments)
- MUST show "Assign to me" button when ticket status is 'new', calling POST /api/tickets/:id/assign
- MUST show "Forward" action when ticket status is 'assigned', with a user selector, calling POST /api/tickets/:id/forward
- MUST show "Close" button when ticket status is 'assigned', calling POST /api/tickets/:id/close
- MUST show comment form with text input and optional file attachment upload
- MUST read files as base64 and validate size (max 1MB) before sending in comment
- MUST fetch organization users for the forward user selector (from GET /api/users)
- MUST refresh ticket data after each action (assign, forward, close, comment)
- MUST add /tickets/:id route to router.tsx inside ProtectedRoute
- MUST use Shadcn components and Tailwind for styling
- MUST handle loading, error, and not-found states
</requirements>

## Subtasks
- [ ] 8.1 Create TicketDetailPage.tsx with ticket metadata display and timeline
- [ ] 8.2 Implement "Assign to me" action for new tickets
- [ ] 8.3 Implement "Forward" action with user selector dropdown
- [ ] 8.4 Implement "Close" action for assigned tickets
- [ ] 8.5 Implement comment form with text input and file attachment support
- [ ] 8.6 Add /tickets/:id route to router.tsx
- [ ] 8.7 Write component tests for the detail page and all actions

## Implementation Details

Create page in `packages/frontend/src/pages/`. This is a standalone page (separate route, not inline). Follow patterns from `TicketTypesPage.tsx` for API calls and form handling. See TechSpec 'API Endpoints > Authenticated Endpoints' for GET /api/tickets/:id response format and all action endpoint formats.

### Relevant Files
- `packages/frontend/src/pages/TicketTypesPage.tsx` — pattern reference for form handling and API calls
- `packages/frontend/src/pages/UsersPage.tsx` — pattern reference for user listing (for forward selector)
- `packages/frontend/src/store/AuthContext.tsx` — current user info for "Assign to me"
- `packages/frontend/src/router.tsx` — route definitions to modify
- `packages/frontend/src/components/ui/button.tsx` — Shadcn button component
- `packages/frontend/src/components/ui/input.tsx` — Shadcn input component

### Dependent Files
- `packages/frontend/src/router.tsx` — new route entry for /tickets/:id

### Related ADRs
- [ADR-001: Ticket Status Workflow](../adrs/adr-001.md) — Determines which actions are available per status
- [ADR-003: File Attachments as Base64 in JSON](../adrs/adr-003.md) — File upload approach in comments

## Deliverables
- `packages/frontend/src/pages/TicketDetailPage.tsx` — full ticket detail page
- Updated `packages/frontend/src/router.tsx` — detail route
- `packages/frontend/src/pages/TicketDetailPage.test.tsx` — component tests **(REQUIRED)**

## Tests
- Unit tests:
  - [ ] TicketDetailPage renders ticket metadata (code, status, name, email, phone, description)
  - [ ] TicketDetailPage displays loading state while fetching
  - [ ] TicketDetailPage displays error state for non-existent ticket (404)
  - [ ] TicketDetailPage shows "Assign to me" button when status is 'new'
  - [ ] TicketDetailPage hides "Assign to me" button when status is not 'new'
  - [ ] TicketDetailPage calls assign endpoint on "Assign to me" click
  - [ ] TicketDetailPage shows "Forward" and "Close" buttons when status is 'assigned'
  - [ ] TicketDetailPage calls forward endpoint with selected userId
  - [ ] TicketDetailPage calls close endpoint on "Close" click
  - [ ] TicketDetailPage renders comments in chronological order
  - [ ] TicketDetailPage renders assignment history entries
  - [ ] TicketDetailPage renders file attachments as downloadable links
  - [ ] TicketDetailPage submits new comment via comment form
  - [ ] TicketDetailPage submits comment with file attachment
  - [ ] TicketDetailPage validates attachment size before submission
  - [ ] TicketDetailPage refreshes data after successful action
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Full ticket detail displays correctly with all related data
- All actions (assign, forward, close, comment) work and refresh the view
- File attachments downloadable from both ticket and comment level
- Correct actions shown based on ticket status


## Task Files

- PRD directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/tickets`
- Task file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/tickets/task_08.md`
- Master tasks file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/tickets/_tasks.md`
- Use these exact paths when `cy-execute-task` updates task tracking.
- Execute every explicit `Validation`, `Test Plan`, or `Testing` item from the task and supporting PRD docs.
- Update task checkboxes and task status only after implementation, verification evidence, and self-review are complete.
- Update the master tasks file only when the current task is actually complete.
- Keep tracking-only files out of automatic commits unless the repository explicitly requires them to be staged.
- Do not create an automatic commit for this run. Leave the diff ready for manual review.
