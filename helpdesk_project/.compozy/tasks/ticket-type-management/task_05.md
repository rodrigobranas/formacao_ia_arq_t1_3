---
status: completed
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
- [x] 5.1 Add required shadcn/ui components (Table, Input, Button, Dialog/AlertDialog) to the project
- [x] 5.2 Create `TicketTypesPage` component that fetches and displays ticket types in a table
- [x] 5.3 Implement the "+ New" inline creation row with validation and save/cancel
- [x] 5.4 Implement inline editing of existing rows with validation and save/cancel
- [x] 5.5 Implement delete with confirmation dialog and in-use error handling
- [x] 5.6 Implement empty state display
- [x] 5.7 Write component tests for all interactions with mocked API responses

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
  - [x] Page renders table with ticket types fetched from API
  - [x] Table displays types with Name and Description columns
  - [x] Clicking "+ New" shows an inline editable row with empty inputs
  - [x] Saving a new type with valid data calls POST and adds the type to the table
  - [x] Saving a new type with empty name shows inline validation error
  - [x] Saving a new type with name > 50 chars shows validation error
  - [x] Canceling creation removes the inline row
  - [x] Clicking "Edit" transforms the row into editable inputs with pre-filled values
  - [x] Saving an edit with valid data calls PUT and updates the row
  - [x] Canceling an edit restores the original values
  - [x] Clicking "Delete" shows a confirmation dialog
  - [x] Confirming delete calls DELETE and removes the row from the table
  - [x] Delete blocked (409 response) shows an in-use error message
  - [x] Empty state shows "No ticket types configured" message with prompt to create
  - [x] API fetch error on page load displays an error message
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
