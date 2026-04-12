---
status: completed
title: Frontend Organization Settings page
type: frontend
complexity: low
dependencies:
    - task_06
    - task_07
---

# Task 11: Frontend Organization Settings page

## Overview
Build the admin-only Organization Settings page. Displays the current organization name and provides an inline edit form to update it. Only accessible to admin users. This is a simple page with a single editable field.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for API endpoints and PRD for org settings flow
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create OrganizationSettingsPage showing the current organization name
- MUST fetch organization details from GET /api/organizations/current with auth header
- MUST provide an edit form to change the organization name
- MUST validate name is not empty (client-side)
- MUST call POST /api/organizations/current/change-name with auth header on save
- MUST display success feedback after saving
- MUST display server-side validation errors
- MUST include Authorization Bearer token header in all API calls
- MUST only be accessible to admin users
- MUST use Shadcn UI components (Button, Input) and Tailwind
</requirements>

## Subtasks
- [ ] 11.1 Create OrganizationSettingsPage with current org name display
- [ ] 11.2 Implement edit form for organization name
- [ ] 11.3 Implement save with API call and feedback
- [ ] 11.4 Write tests for the page

## Implementation Details
Create `OrganizationSettingsPage.tsx` in the pages directory. Follow simple form patterns. Use AuthContext to get the token for API calls. The route should already be defined in router.tsx from task_07.

### Relevant Files
- `packages/frontend/src/pages/TicketTypesPage.tsx` — Reference for form patterns and error handling
- `packages/frontend/src/components/ui/button.tsx` — Shadcn Button component
- `packages/frontend/src/components/ui/input.tsx` — Shadcn Input component
- `packages/frontend/src/store/AuthContext.tsx` — Auth token (task_07)

### Dependent Files
- `packages/frontend/src/router.tsx` — Route already configured in task_07

## Deliverables
- `packages/frontend/src/pages/OrganizationSettingsPage.tsx` with view and edit functionality
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for settings flow **(REQUIRED)**

## Tests
- Unit tests:
  - [ ] OrganizationSettingsPage fetches and displays current organization name
  - [ ] Edit form pre-fills with current organization name
  - [ ] Save button calls POST /api/organizations/current/change-name with auth header
  - [ ] Validation error shown when name is empty
  - [ ] Success feedback displayed after saving
  - [ ] Server error displayed on failure
- Integration tests:
  - [ ] Full edit flow: change name, save, updated name displayed
  - [ ] Error flow: empty name shows validation error, no API call made
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Organization name displayed and editable by admin
- Save with success/error feedback works correctly
- Only accessible to admin users
