---
status: completed
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
- [x] 7.1 Create AuthContext with AuthState interface, Provider, and custom hook
- [x] 7.2 Implement signin function (API call, token storage, state update)
- [x] 7.3 Implement signout function (clear storage, redirect)
- [x] 7.4 Implement token restoration from localStorage on mount
- [x] 7.5 Create ProtectedRoute wrapper component
- [x] 7.6 Update router.tsx with public and protected route structure
- [x] 7.7 Write tests for AuthContext, ProtectedRoute, and routing

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
  - [x] AuthContext provides null user when no token in localStorage
  - [x] AuthContext restores user state from localStorage token on mount
  - [x] signin() stores token in localStorage and updates user state
  - [x] signout() removes token from localStorage and clears user state
  - [x] useAuth hook returns current auth state
- Integration tests:
  - [x] ProtectedRoute redirects to /signin when not authenticated
  - [x] ProtectedRoute renders children when authenticated
  - [x] Public routes (/signup, /signin) accessible without authentication
  - [x] Navigating to protected route while unauthenticated redirects to /signin
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Auth state persists across page refreshes via localStorage
- Unauthenticated users cannot access protected routes
- Signin/signout functions work correctly
- Router structure supports both public and protected routes
