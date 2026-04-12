# Implementation Task: task_12.md

## Task Context

- **Title**: Frontend TicketTypesPage update with auth
- **Type**: frontend
- **Complexity**: low
- **Dependencies**: task_04, task_07


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
- Current task memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin/memory/task_12.md`
- Use installed `cy-workflow-memory` before editing code and before finishing the task.
- Read both memory files before implementation. Promote durable cross-task context only to shared workflow memory.
- Keep task-local decisions, learnings, touched surfaces, and corrections in the current task memory file.


## Task Specification

---
status: pending
title: Frontend TicketTypesPage update with auth
type: frontend
complexity: low
dependencies:
  - task_04
  - task_07
---

# Task 12: Frontend TicketTypesPage update with auth

## Overview
Update the existing TicketTypesPage to work with the new authentication system. All API calls must include the Authorization header. Create, edit, and delete operations must be restricted to admin users. The page must handle 401 responses by triggering signout.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for updated ticket type endpoints
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST add Authorization Bearer token header to all fetch calls (GET, POST, PUT, DELETE)
- MUST get token from AuthContext
- MUST hide create, edit, and delete controls for non-admin users
- MUST show ticket types in read-only mode for regular users
- MUST handle 401 responses by triggering signout (redirect to signin)
- MUST preserve all existing functionality for admin users
</requirements>

## Subtasks
- [ ] 12.1 Add Authorization header to all fetch calls
- [ ] 12.2 Conditionally render create/edit/delete controls based on admin role
- [ ] 12.3 Handle 401 responses globally (trigger signout)
- [ ] 12.4 Update existing tests and add new auth-related tests

## Implementation Details
Modify the existing `TicketTypesPage.tsx` to use AuthContext. Get the token and admin flag from the `useAuth()` hook. Add the Authorization header to all fetch calls. Conditionally render mutation controls based on the admin flag.

### Relevant Files
- `packages/frontend/src/pages/TicketTypesPage.tsx` — Page to modify with auth integration
- `packages/frontend/src/pages/TicketTypesPage.test.tsx` — Existing tests to update
- `packages/frontend/src/store/AuthContext.tsx` — Auth token and admin check (task_07)

### Dependent Files
- `packages/frontend/src/pages/TicketTypesPage.test.tsx` — Tests must be updated to mock AuthContext

## Deliverables
- Updated `packages/frontend/src/pages/TicketTypesPage.tsx` with auth integration
- Updated `packages/frontend/src/pages/TicketTypesPage.test.tsx` with auth mocking
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for auth behavior **(REQUIRED)**

## Tests
- Unit tests:
  - [ ] TicketTypesPage includes Authorization header in GET /api/ticket-types call
  - [ ] TicketTypesPage includes Authorization header in POST call
  - [ ] TicketTypesPage includes Authorization header in PUT call
  - [ ] TicketTypesPage includes Authorization header in DELETE call
  - [ ] Admin user sees create, edit, and delete controls
  - [ ] Regular user sees ticket types in read-only mode (no create/edit/delete)
- Integration tests:
  - [ ] Full CRUD flow works with admin auth token
  - [ ] Read-only view renders correctly for regular user
  - [ ] 401 response triggers signout and redirect to /signin
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- All API calls include auth headers
- Admin users retain full CRUD functionality
- Regular users see read-only view
- 401 responses handled gracefully


## Task Files

- PRD directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin`
- Task file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin/task_12.md`
- Master tasks file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin/_tasks.md`
- Use these exact paths when `cy-execute-task` updates task tracking.
- Execute every explicit `Validation`, `Test Plan`, or `Testing` item from the task and supporting PRD docs.
- Update task checkboxes and task status only after implementation, verification evidence, and self-review are complete.
- Update the master tasks file only when the current task is actually complete.
- Keep tracking-only files out of automatic commits unless the repository explicitly requires them to be staged.
- Do not create an automatic commit for this run. Leave the diff ready for manual review.
