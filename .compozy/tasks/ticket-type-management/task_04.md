---
status: completed
title: "Frontend routing and settings layout"
type: frontend
complexity: medium
dependencies: []
---

# Task 04: Frontend routing and settings layout

## Overview

Introduce client-side routing to the frontend using React Router v7 and create the Settings area layout with a sidebar navigation. This establishes the navigational structure described in the PRD — a Settings page with a left sidebar listing configuration categories and a main content area rendered via an Outlet. The existing health check landing page is preserved as the home route.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST install `react-router` as a dependency in the frontend workspace
- MUST refactor `main.tsx` to use React Router's `RouterProvider` (or `BrowserRouter`) as the app root
- MUST preserve the existing health check landing page as the home route (`/`)
- MUST create a Settings layout component with a left sidebar and a main content `<Outlet>`
- MUST add "Ticket Types" as the first (and only) sidebar navigation item, linking to `/settings/ticket-types`
- MUST use `NavLink` for active state styling on sidebar items
- MUST add a "Settings" link/icon in the main app navigation that navigates to `/settings`
- MUST redirect `/settings` to `/settings/ticket-types` (the default settings page)
- MUST update `vite.config.ts` coverage `include` to cover new source files
- MUST update existing `App.test.tsx` to work with the new router setup
</requirements>

## Subtasks
- [x] 4.1 Install `react-router` dependency in the frontend workspace
- [x] 4.2 Define route configuration with home (`/`), settings layout (`/settings`), and ticket types (`/settings/ticket-types`) routes
- [x] 4.3 Refactor `main.tsx` and `App.tsx` to integrate with React Router
- [x] 4.4 Create `SettingsLayout` component with sidebar navigation and `<Outlet>`
- [x] 4.5 Add main navigation with a "Settings" link
- [x] 4.6 Update `vite.config.ts` coverage configuration for new files
- [x] 4.7 Write component tests for routing, layout, sidebar, and navigation

## Implementation Details

Install `react-router` in the frontend workspace. Restructure the app entry point to use React Router's provider. Create a `SettingsLayout` component that renders a two-column layout: sidebar with `NavLink` items on the left, `<Outlet>` on the right. See TechSpec "System Architecture" and PRD "Settings Layout" sections for the component hierarchy.

The `/settings` route redirects to `/settings/ticket-types`. The ticket types route renders a placeholder until task_05 implements the full page.

### Relevant Files
- `frontend/src/main.tsx` — App entry point to refactor with router provider
- `frontend/src/App.tsx` — Current root component; health check page becomes home route
- `frontend/src/App.test.tsx` — Existing tests that need updating for router context
- `frontend/package.json` — Add `react-router` dependency
- `frontend/vite.config.ts` — Update coverage `include` array
- `frontend/components.json` — shadcn/ui alias config (`@/components`, `@/lib/utils`)

### Dependent Files
- `frontend/src/pages/TicketTypesPage.tsx` (task_05) — Will be rendered inside the Settings layout Outlet

### Related ADRs
- [ADR-003: React Router v7 for Frontend Navigation](adrs/adr-003.md) — Chose React Router v7 for nested layout support

## Deliverables
- `react-router` installed in frontend workspace
- Refactored `main.tsx` with router provider
- `SettingsLayout` component with sidebar and outlet
- Updated route configuration with home, settings, and ticket-types routes
- Updated `App.test.tsx` for router compatibility
- Updated `vite.config.ts` coverage configuration
- Unit tests with 80%+ coverage **(REQUIRED)**

## Tests
- Unit tests:
  - [x] Home route (`/`) renders the health check landing page
  - [x] Navigating to `/settings` redirects to `/settings/ticket-types`
  - [x] Settings layout renders the sidebar with "Ticket Types" nav item
  - [x] "Ticket Types" nav item has active styling when on `/settings/ticket-types`
  - [x] "Settings" link in main navigation navigates to `/settings`
  - [x] Outlet renders child route content within the settings layout
  - [x] Existing health check functionality still works on the home page
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Navigating to `/settings` shows the settings layout with sidebar
- "Ticket Types" is the active sidebar item on `/settings/ticket-types`
- Home page (`/`) still shows the health check landing page
- Existing `App.test.tsx` tests pass (updated for router context)
