# Implementation Task: task_08.md

## Task Context

- **Title**: Frontend Signup and Signin pages
- **Type**: frontend
- **Complexity**: medium
- **Dependencies**: task_03, task_07


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
- Current task memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin/memory/task_08.md`
- Use installed `cy-workflow-memory` before editing code and before finishing the task.
- Read both memory files before implementation. Promote durable cross-task context only to shared workflow memory.
- Keep task-local decisions, learnings, touched surfaces, and corrections in the current task memory file.


## Task Specification

---
status: pending
title: Frontend Signup and Signin pages
type: frontend
complexity: medium
dependencies:
  - task_03
  - task_07
---

# Task 8: Frontend Signup and Signin pages

## Overview
Build the public-facing signup and signin pages. The signup page collects organization name, admin name, email, password, and password confirmation in a single form. The signin page collects email and password. Both pages include form validation, error handling, and navigation links between each other.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for API request/response formats
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create SignupPage with fields: organization name, admin name, email, password, password confirmation
- MUST validate all fields are required (client-side)
- MUST validate password and confirmation match (client-side)
- MUST validate password minimum 8 characters (client-side)
- MUST call POST /api/signup on form submission
- MUST display server-side validation errors inline
- MUST redirect to /signin on successful signup (or auto-signin)
- MUST include link to /signin ("Already have an account?")
- MUST create SigninPage with fields: email, password
- MUST call POST /api/signin via AuthContext's signin function
- MUST display generic error message for invalid credentials
- MUST redirect to dashboard (/) on successful signin
- MUST include link to /signup ("Create a new organization")
- MUST use Shadcn UI components (Button, Input) and Tailwind for styling
</requirements>

## Subtasks
- [ ] 8.1 Create SignupPage component with form fields and validation
- [ ] 8.2 Implement signup form submission with API call and error handling
- [ ] 8.3 Create SigninPage component with form fields
- [ ] 8.4 Implement signin form submission using AuthContext
- [ ] 8.5 Add navigation links between signup and signin pages
- [ ] 8.6 Write tests for both pages

## Implementation Details
Create `SignupPage.tsx` and `SigninPage.tsx` in the pages directory. Use existing Shadcn components (Button, Input) from `packages/frontend/src/components/ui/`. Follow the form patterns from `TicketTypesPage.tsx` for inline validation and error display. Routes are already defined in router.tsx from task_07.

### Relevant Files
- `packages/frontend/src/pages/TicketTypesPage.tsx` — Reference for form handling, validation, error display patterns
- `packages/frontend/src/components/ui/button.tsx` — Shadcn Button component
- `packages/frontend/src/components/ui/input.tsx` — Shadcn Input component
- `packages/frontend/src/store/AuthContext.tsx` — signin function from AuthContext (task_07)
- `packages/frontend/src/router.tsx` — Routes defined in task_07

### Dependent Files
- `packages/frontend/src/router.tsx` — Routes already configured in task_07

## Deliverables
- `packages/frontend/src/pages/SignupPage.tsx` with full form and validation
- `packages/frontend/src/pages/SigninPage.tsx` with full form and validation
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for form flows **(REQUIRED)**

## Tests
- Unit tests:
  - [ ] SignupPage renders all form fields (org name, name, email, password, confirmation)
  - [ ] SignupPage shows validation error when required fields are empty
  - [ ] SignupPage shows error when passwords don't match
  - [ ] SignupPage shows error when password is less than 8 characters
  - [ ] SignupPage calls POST /api/signup with correct payload on valid submission
  - [ ] SignupPage displays server error messages (e.g., duplicate email)
  - [ ] SigninPage renders email and password fields
  - [ ] SigninPage shows error for invalid credentials
  - [ ] SigninPage calls signin function from AuthContext on submission
- Integration tests:
  - [ ] SignupPage navigates to /signin on successful signup
  - [ ] SigninPage navigates to / (dashboard) on successful signin
  - [ ] SignupPage has link to /signin
  - [ ] SigninPage has link to /signup
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Forms are fully functional with client and server-side validation
- Users can sign up and sign in successfully
- Navigation between signup and signin works
- UI uses Shadcn components and Tailwind styling


## Task Files

- PRD directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin`
- Task file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin/task_08.md`
- Master tasks file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin/_tasks.md`
- Use these exact paths when `cy-execute-task` updates task tracking.
- Execute every explicit `Validation`, `Test Plan`, or `Testing` item from the task and supporting PRD docs.
- Update task checkboxes and task status only after implementation, verification evidence, and self-review are complete.
- Update the master tasks file only when the current task is actually complete.
- Keep tracking-only files out of automatic commits unless the repository explicitly requires them to be staged.
- Do not create an automatic commit for this run. Leave the diff ready for manual review.
