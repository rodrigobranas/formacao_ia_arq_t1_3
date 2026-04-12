---
status: completed
title: Frontend User Management page
type: frontend
complexity: medium
dependencies:
  - task_05
  - task_07
---

# Task 10: Frontend User Management page

## Overview
Build the admin-only User Management page. Displays a table of all users in the organization with name, email, and role. Provides a form to create new users and a delete action with confirmation dialog. This page is only accessible to admin users.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for API endpoints and PRD for user management flow
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create UsersPage displaying a table of all users in the organization
- MUST show user name, email, and role (admin/regular) in the table
- MUST provide a form to create new users with fields: name, email, password, admin toggle
- MUST validate required fields and password minimum length (client-side)
- MUST call POST /api/users with Authorization header on create
- MUST call DELETE /api/users/:userId with Authorization header on delete
- MUST show confirmation dialog before deleting a user (use Shadcn AlertDialog)
- MUST display server-side validation errors (e.g., duplicate email)
- MUST include Authorization Bearer token header in all API calls
- MUST only be accessible to admin users (route protection)
- MUST use Shadcn UI components (Button, Input, Table, AlertDialog) and Tailwind
</requirements>

## Subtasks
- [ ] 10.1 Create UsersPage with user list table
- [ ] 10.2 Implement create user form with validation
- [ ] 10.3 Implement delete user with confirmation dialog
- [ ] 10.4 Add Authorization header to all API calls
- [ ] 10.5 Handle loading states and error display
- [ ] 10.6 Write tests for the page

## Implementation Details
Create `UsersPage.tsx` in the pages directory. Follow patterns from `TicketTypesPage.tsx` for table display, inline form, and delete confirmation. Use AuthContext to get the token for API calls and check admin role. The route should already be defined in router.tsx from task_07.

### Relevant Files
- `packages/frontend/src/pages/TicketTypesPage.tsx` — Reference for table, form, delete confirmation patterns
- `packages/frontend/src/components/ui/table.tsx` — Shadcn Table component
- `packages/frontend/src/components/ui/button.tsx` — Shadcn Button component
- `packages/frontend/src/components/ui/input.tsx` — Shadcn Input component
- `packages/frontend/src/components/ui/alert-dialog.tsx` — Shadcn AlertDialog for delete confirmation
- `packages/frontend/src/store/AuthContext.tsx` — Auth token and admin check (task_07)

### Dependent Files
- `packages/frontend/src/router.tsx` — Route already configured in task_07

## Deliverables
- `packages/frontend/src/pages/UsersPage.tsx` with full CRUD UI
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for user management flows **(REQUIRED)**

## Tests
- Unit tests:
  - [ ] UsersPage renders user table with name, email, and role columns
  - [ ] UsersPage fetches users on mount with Authorization header
  - [ ] Create form validates required fields
  - [ ] Create form validates password minimum length
  - [ ] Create form calls POST /api/users with correct payload and auth header
  - [ ] Create form displays server validation errors (duplicate email)
  - [ ] Delete button shows confirmation dialog
  - [ ] Confirming delete calls DELETE /api/users/:id with auth header
  - [ ] Delete displays error when admin tries to delete themselves (403)
- Integration tests:
  - [ ] Full create user flow: fill form, submit, user appears in table
  - [ ] Full delete user flow: click delete, confirm, user removed from table
  - [ ] Error flow: duplicate email shows error, form remains editable
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- User table displays all organization users
- Create and delete operations work with proper auth
- Confirmation dialog prevents accidental deletion
- Server errors displayed to admin
