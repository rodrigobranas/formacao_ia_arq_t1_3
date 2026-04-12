---
status: completed
title: Frontend Dashboard and App header update
type: frontend
complexity: medium
dependencies:
  - task_07
---

# Task 9: Frontend Dashboard and App header update

## Overview
Build the Dashboard page (post-signin landing page) and update the App header to display organization identity, user info, conditional navigation items, and a signout button. The Dashboard shows a welcome message and serves as the navigation hub. The header provides organization context visible to all authenticated users.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for navigation structure and component layout
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create DashboardPage displaying welcome message with user name and organization name
- MUST make Dashboard the default landing page after signin (index route)
- MUST update App header to display the current organization name
- MUST update App header to display the current user name
- MUST add navigation items: Dashboard, Ticket Types, User Management (admin only), Organization Settings (admin only)
- MUST conditionally show/hide admin-only nav items based on user role from AuthContext
- MUST add a signout button/link in the header that calls AuthContext's signout
- MUST use Shadcn UI components and Tailwind for styling
</requirements>

## Subtasks
- [x] 9.1 Create DashboardPage with welcome message using AuthContext user data
- [x] 9.2 Update App header to show organization name and user name
- [x] 9.3 Update navigation with conditional admin-only items
- [x] 9.4 Add signout button to the header
- [x] 9.5 Update router to set Dashboard as the index route
- [x] 9.6 Write tests for Dashboard and updated header

## Implementation Details
Create `DashboardPage.tsx` in the pages directory. Update `App.tsx` to use AuthContext for displaying user/org info and conditional navigation. See PRD "Post-Signin Navigation" section for navigation items. The header should use the existing NavLink pattern from App.tsx.

### Relevant Files
- `packages/frontend/src/App.tsx` — Current header with navigation (NavLink to "/" and "/settings")
- `packages/frontend/src/store/AuthContext.tsx` — Auth state with user info (task_07)
- `packages/frontend/src/router.tsx` — Route definitions (task_07)
- `packages/frontend/src/pages/HomePage.tsx` — Current index page (will be replaced by Dashboard as landing)
- `packages/frontend/src/pages/SettingsLayout.tsx` — Settings sidebar pattern for reference

### Dependent Files
- `packages/frontend/src/router.tsx` — Dashboard route already added in task_07, may need index adjustment
- `packages/frontend/src/App.tsx` — Header modifications

## Deliverables
- `packages/frontend/src/pages/DashboardPage.tsx` with welcome message
- Updated `packages/frontend/src/App.tsx` with org name, user name, conditional nav, signout
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for navigation and role-based visibility **(REQUIRED)**

## Tests
- Unit tests:
  - [ ] DashboardPage displays welcome message with user name
  - [ ] DashboardPage displays organization name
  - [ ] App header shows organization name from AuthContext
  - [ ] App header shows user name from AuthContext
  - [ ] App header shows signout button when authenticated
  - [ ] Signout button calls signout function from AuthContext
- Integration tests:
  - [ ] Admin user sees User Management and Organization Settings nav items
  - [ ] Regular user does NOT see User Management and Organization Settings nav items
  - [ ] Both admin and regular users see Dashboard and Ticket Types nav items
  - [ ] Clicking signout redirects to /signin
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Dashboard displays correct welcome message with user/org context
- Header shows organization identity for all authenticated users
- Admin-only nav items hidden from regular users
- Signout works correctly
