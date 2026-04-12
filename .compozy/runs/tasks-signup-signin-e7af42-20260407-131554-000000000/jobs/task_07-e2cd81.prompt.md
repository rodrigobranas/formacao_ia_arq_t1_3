# Implementation Task: task_07.md

## Task Context

- **Title**: Frontend AuthContext and protected routing
- **Type**: frontend
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
- Read `AGENTS.md`, `CLAUDE.md`, and the PRD documents under `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin` before editing code.
- Treat the task specification below plus the supporting PRD documents, especially `_techspec.md` and `_tasks.md`, as the source of truth.
- Keep scope tight to this task and record meaningful follow-up work instead of expanding scope silently.
- Use installed `cy-final-verify` before any completion claim or automatic commit.
- Automatic commits are disabled for this run (`--auto-commit=false`).
</critical>

## Workflow Memory

- Memory directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin/memory`
- Shared workflow memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin/memory/MEMORY.md`
- Current task memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin/memory/task_07.md`
- Use installed `cy-workflow-memory` before editing code and before finishing the task.
- Read both memory files before implementation. Promote durable cross-task context only to shared workflow memory.
- Keep task-local decisions, learnings, touched surfaces, and corrections in the current task memory file.


## Task Specification

---
status: pending
title: Frontend AuthContext and protected routing
type: frontend
complexity: medium
dependencies:
  - task_03
---

# Task 7: Frontend AuthContext and protected routing

## Overview
Implement the frontend authentication infrastructure. AuthContext manages JWT storage in localStorage, decoded user state, and signin/signout helpers. ProtectedRoute redirects unauthenticated users to the signin page. The router is updated to define public routes (signup, signin) and protect all existing and new routes.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC "Core Interfaces — AuthContext" section for AuthState interface
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create AuthContext with the AuthState interface from TechSpec (token, user, signin, signout)
- MUST store JWT token in localStorage on signin
- MUST remove JWT token from localStorage on signout
- MUST decode and expose user info: userId, organizationId, admin, name, organizationName
- MUST read token from localStorage on app initialization (persist sessions across refreshes)
- MUST provide a `signin(email, password)` async function that calls POST /api/signin
- MUST provide a `signout()` function that clears state and redirects to /signin
- MUST create ProtectedRoute component that redirects to /signin when not authenticated
- MUST update router.tsx with public routes (/signup, /signin) and protected routes
- MUST handle 401 API responses globally by triggering signout
</requirements>

## Subtasks
- [ ] 7.1 Create AuthContext with AuthState interface, Provider, and custom hook
- [ ] 7.2 Implement signin function (API call, token storage, state update)
- [ ] 7.3 Implement signout function (clear storage, redirect)
- [ ] 7.4 Implement token restoration from localStorage on mount
- [ ] 7.5 Create ProtectedRoute wrapper component
- [ ] 7.6 Update router.tsx with public and protected route structure
- [ ] 7.7 Write tests for AuthContext, ProtectedRoute, and routing

## Implementation Details
Create `AuthContext.tsx` in the store directory and update `router.tsx`. See TechSpec "Core Interfaces — AuthContext" section for the AuthState interface. The ProtectedRoute should wrap the App layout route so all child routes are protected. Public routes (signup, signin) live outside the protected wrapper.

### Relevant Files
- `packages/frontend/src/router.tsx` — Current routing with App layout, HomePage, SettingsLayout, TicketTypesPage
- `packages/frontend/src/App.tsx` — Root layout component with header navigation
- `packages/frontend/src/main.tsx` — React entry point where AuthProvider should wrap RouterProvider
- `packages/frontend/src/types/types.ts` — Shared TypeScript types

### Dependent Files
- `packages/frontend/src/pages/SignupPage.tsx` — Will be a public route (task_08)
- `packages/frontend/src/pages/SigninPage.tsx` — Will be a public route (task_08)
- `packages/frontend/src/pages/DashboardPage.tsx` — Will be a protected route (task_09)
- `packages/frontend/src/pages/UsersPage.tsx` — Will use admin check from context (task_10)
- `packages/frontend/src/App.tsx` — Will use auth context for header (task_09)

## Deliverables
- `packages/frontend/src/store/AuthContext.tsx` with AuthProvider, useAuth hook, ProtectedRoute
- Updated `packages/frontend/src/router.tsx` with public and protected routes
- Updated `packages/frontend/src/main.tsx` with AuthProvider wrapping
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for auth flow and routing **(REQUIRED)**

## Tests
- Unit tests:
  - [ ] AuthContext provides null user when no token in localStorage
  - [ ] AuthContext restores user state from localStorage token on mount
  - [ ] signin() stores token in localStorage and updates user state
  - [ ] signout() removes token from localStorage and clears user state
  - [ ] useAuth hook returns current auth state
- Integration tests:
  - [ ] ProtectedRoute redirects to /signin when not authenticated
  - [ ] ProtectedRoute renders children when authenticated
  - [ ] Public routes (/signup, /signin) accessible without authentication
  - [ ] Navigating to protected route while unauthenticated redirects to /signin
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Auth state persists across page refreshes via localStorage
- Unauthenticated users cannot access protected routes
- Signin/signout functions work correctly
- Router structure supports both public and protected routes


## Task Files

- PRD directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin`
- Task file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin/task_07.md`
- Master tasks file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/signup-signin/_tasks.md`
- Use these exact paths when `cy-execute-task` updates task tracking.
- Execute every explicit `Validation`, `Test Plan`, or `Testing` item from the task and supporting PRD docs.
- Update task checkboxes and task status only after implementation, verification evidence, and self-review are complete.
- Update the master tasks file only when the current task is actually complete.
- Keep tracking-only files out of automatic commits unless the repository explicitly requires them to be staged.
- Do not create an automatic commit for this run. Leave the diff ready for manual review.
