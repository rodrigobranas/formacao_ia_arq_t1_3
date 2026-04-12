# Implementation Task: task_05.md

## Task Context

- **Title**: Frontend ticket types page with inline editing
- **Type**: frontend
- **Complexity**: high
- **Dependencies**: task_03, task_04


<required_skills>
- `cy-workflow-memory`: required when workflow memory paths are provided for this task
- `cy-execute-task`: required end-to-end workflow for a PRD task
- `cy-final-verify`: required before any completion claim or automatic commit
</required_skills>

<critical>
- Use installed `cy-workflow-memory` before editing code when workflow memory paths are provided below.
- Use installed `cy-execute-task` as the execution workflow for this task.
- Read `AGENTS.md`, `CLAUDE.md`, and the PRD documents under `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/ticket-type-management` before editing code.
- Treat the task specification below plus the supporting PRD documents, especially `_techspec.md` and `_tasks.md`, as the source of truth.
- Keep scope tight to this task and record meaningful follow-up work instead of expanding scope silently.
- Use installed `cy-final-verify` before any completion claim or automatic commit.
- Automatic commits are disabled for this run (`--auto-commit=false`).
</critical>

## Workflow Memory

- Memory directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/ticket-type-management/memory`
- Shared workflow memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/ticket-type-management/memory/MEMORY.md`
- Current task memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/ticket-type-management/memory/task_05.md`
- Use installed `cy-workflow-memory` before editing code and before finishing the task.
- Read both memory files before implementation. Promote durable cross-task context only to shared workflow memory.
- Keep task-local decisions, learnings, touched surfaces, and corrections in the current task memory file.


## Task Specification

---
status: pending
title: "Frontend ticket types page with inline editing"
type: frontend
complexity: high
dependencies:
  - task_03
  - task_04
---

# Task 05: Frontend ticket types page with inline editing

## Overview

Build the main Ticket Types management page that renders inside the Settings layout. Users can view all ticket types in a table, create new types via an inline row, edit existing types inline, and delete types with a confirmation dialog. This is the primary user-facing feature, implementing the inline editing UX described in the PRD and ADR-001.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST fetch ticket types from `GET /api/ticket-types` on page load and display in a table with Name and Description columns
- MUST display types in alphabetical order (as returned by the API)
- MUST provide a "+ New" button that inserts an inline editable row at the top of the table with Name and Description inputs, plus Save and Cancel buttons
- MUST validate inline form: name required, name max 50 chars, description max 255 chars. Show inline error messages.
- MUST provide an "Edit" action per row that transforms the row into editable inputs with current values pre-filled, plus Save and Cancel buttons
- MUST provide a "Delete" action per row that shows a confirmation dialog (shadcn/ui AlertDialog or Dialog)
- MUST handle delete-blocked responses (409) by showing a message explaining the type is in use
- MUST show empty state message "No ticket types configured. Click '+ New' to create one." when no types exist
- MUST handle API errors gracefully (display error messages, don't crash)
- MUST use shadcn/ui components (Table, Input, Button, Dialog) for consistent styling
- MUST write component tests covering all user interactions with mocked fetch
</requirements>

## Subtasks
- [ ] 5.1 Add required shadcn/ui components (Table, Input, Button, Dialog/AlertDialog) to the project
- [ ] 5.2 Create `TicketTypesPage` component that fetches and displays ticket types in a table
- [ ] 5.3 Implement the "+ New" inline creation row with validation and save/cancel
- [ ] 5.4 Implement inline editing of existing rows with validation and save/cancel
- [ ] 5.5 Implement delete with confirmation dialog and in-use error handling
- [ ] 5.6 Implement empty state display
- [ ] 5.7 Write component tests for all interactions with mocked API responses

## Implementation Details

Create `frontend/src/pages/TicketTypesPage.tsx` as the main page component. Use React state to manage the list of ticket types, editing state (which row is being edited), and creation mode (inline row visible or not). API calls use `fetch()` to the backend endpoints defined in TechSpec "API Endpoints" section.

Add shadcn/ui components via `npx shadcn@latest add table input button alert-dialog` (or similar). These generate files under `frontend/src/components/ui/`. See TechSpec "System Architecture" for the component hierarchy and PRD "Ticket Types Page Flow" for UX details.

Register this page as the route element for `/settings/ticket-types` in the router configuration created in task_04.

### Relevant Files
- `frontend/src/pages/SettingsLayout.tsx` — Parent layout with Outlet where this page renders (created in task_04)
- `frontend/src/lib/utils.ts` — `cn()` utility for Tailwind class merging
- `frontend/components.json` — shadcn/ui configuration for component generation
- `frontend/vite.config.ts` — Coverage config to include new page files

### Dependent Files
- Router configuration (created in task_04) — Must register `TicketTypesPage` as the `/settings/ticket-types` route element

### Related ADRs
- [ADR-001: Inline Settings Page for Ticket Type Management](adrs/adr-001.md) — Chose inline table editing UX pattern

## Deliverables
- shadcn/ui components added to the project (Table, Input, Button, AlertDialog)
- `frontend/src/pages/TicketTypesPage.tsx` with full CRUD inline editing
- Updated router configuration to render the page at `/settings/ticket-types`
- Updated `vite.config.ts` coverage to include new files
- Unit tests with 80%+ coverage **(REQUIRED)**

## Tests
- Unit tests:
  - [ ] Page renders table with ticket types fetched from API
  - [ ] Table displays types with Name and Description columns
  - [ ] Clicking "+ New" shows an inline editable row with empty inputs
  - [ ] Saving a new type with valid data calls POST and adds the type to the table
  - [ ] Saving a new type with empty name shows inline validation error
  - [ ] Saving a new type with name > 50 chars shows validation error
  - [ ] Canceling creation removes the inline row
  - [ ] Clicking "Edit" transforms the row into editable inputs with pre-filled values
  - [ ] Saving an edit with valid data calls PUT and updates the row
  - [ ] Canceling an edit restores the original values
  - [ ] Clicking "Delete" shows a confirmation dialog
  - [ ] Confirming delete calls DELETE and removes the row from the table
  - [ ] Delete blocked (409 response) shows an in-use error message
  - [ ] Empty state shows "No ticket types configured" message with prompt to create
  - [ ] API fetch error on page load displays an error message
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Users can create, view, edit, and delete ticket types through the inline table
- Validation errors appear inline next to the relevant field
- Delete confirmation dialog prevents accidental deletion
- In-use ticket types cannot be deleted (409 error displayed)
- Empty state is shown when no ticket types exist
- All interactions use shadcn/ui components for consistent styling


## Task Files

- PRD directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/ticket-type-management`
- Task file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/ticket-type-management/task_05.md`
- Master tasks file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/ticket-type-management/_tasks.md`
- Use these exact paths when `cy-execute-task` updates task tracking.
- Execute every explicit `Validation`, `Test Plan`, or `Testing` item from the task and supporting PRD docs.
- Update task checkboxes and task status only after implementation, verification evidence, and self-review are complete.
- Update the master tasks file only when the current task is actually complete.
- Keep tracking-only files out of automatic commits unless the repository explicitly requires them to be staged.
- Do not create an automatic commit for this run. Leave the diff ready for manual review.
