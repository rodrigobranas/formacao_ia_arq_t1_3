---
status: completed
title: Rewrite DashboardPage with real-time view
type: frontend
complexity: high
dependencies:
    - task_04
    - task_05
---

# Task 6: Rewrite DashboardPage with real-time view

## Overview

Replace the current placeholder DashboardPage with the real-time operations hub. This is the primary view that operations managers will use daily, featuring KPI cards at the top, a live ticket queue summary in the center, auto-refresh every 30 seconds, and tab navigation to the trends view. This page must become the compelling "home screen" that drives daily active usage.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST replace the existing DashboardPage placeholder content entirely
- MUST render 6 KpiCard components in a horizontal row: Open Tickets, Unassigned Tickets, Oldest Waiting Ticket, Tickets Closed Today, Avg Resolution Time, New Tickets Today
- MUST render a ticket queue table showing the top 15 most urgent tickets sorted by age
- MUST display ticket code, subject, status, assigned agent (or "Unassigned"), ticket type, and age for each queue item
- MUST make queue rows clickable, navigating to the ticket detail page
- MUST implement auto-refresh every 30 seconds using `setInterval`
- MUST display a "Last refreshed" timestamp that updates on each successful refresh
- MUST provide a manual refresh button
- MUST show loading skeletons during initial load
- MUST show error state if the metrics API fails
- MUST include tab navigation between "Real-time" and "Trends" views
- MUST format time durations humanely (e.g., "2h 15m" instead of "135 minutes")
- MUST fetch from `GET /api/dashboard/metrics` (without period param for real-time tab)
- MUST follow the existing fetch + useState + useEffect data fetching pattern
- MUST include a "View all tickets" link in the queue section
</requirements>

## Subtasks
- [x] 6.1 Replace DashboardPage content with the three-zone layout (KPI cards, queue table, tab bar)
- [x] 6.2 Implement data fetching from the metrics API endpoint
- [x] 6.3 Implement 30-second auto-refresh with setInterval and cleanup on unmount
- [x] 6.4 Render KPI cards with formatted values and Lucide icons
- [x] 6.5 Render the ticket queue table with clickable rows and status badges
- [x] 6.6 Add loading skeletons, error state, and refresh indicator
- [x] 6.7 Write component tests for DashboardPage

## Implementation Details

Rewrite `packages/frontend/src/pages/DashboardPage.tsx`. Use the existing data fetching pattern from `TicketsPage.tsx` (useEffect + useState + fetch). Add tab state management for switching between real-time and trends views. The trends tab content is implemented in task_07. See TechSpec "System Architecture" section for the component overview.

### Relevant Files
- `packages/frontend/src/pages/DashboardPage.tsx` — File to rewrite
- `packages/frontend/src/pages/TicketsPage.tsx` — Data fetching pattern (useEffect, useState, fetch, loading/error states)
- `packages/frontend/src/components/ui/KpiCard.tsx` (task_05) — KPI card component to use
- `packages/frontend/src/components/ui/table.tsx` — Table components for queue rendering
- `packages/frontend/src/components/ui/skeleton.tsx` — Skeleton loader for loading states
- `packages/frontend/src/types/types.ts` — Dashboard metric types
- `packages/frontend/src/store/AuthContext.tsx` — Auth context for authenticated fetch

### Dependent Files
- `packages/frontend/src/pages/TrendsTab.tsx` (task_07) — Will be rendered within the trends tab of this page

### Related ADRs
- [ADR-001: Dashboard Product Approach — Real-Time Operations Hub](../adrs/adr-001.md) — This task implements the chosen real-time operations hub layout
- [ADR-004: API Design — Single Metrics Endpoint with Polling Refresh](../adrs/adr-004.md) — Implements the 30s polling refresh pattern

## Deliverables
- Rewritten `packages/frontend/src/pages/DashboardPage.tsx` with real-time operations hub
- Unit tests with 80%+ coverage **(REQUIRED)**

## Tests
- Unit tests:
  - [ ] DashboardPage renders 6 KPI cards with correct labels
  - [ ] DashboardPage renders ticket queue table with ticket data
  - [ ] Queue rows are clickable and navigate to ticket detail page
  - [ ] Unassigned tickets show "Unassigned" instead of agent name
  - [ ] Auto-refresh fires every 30 seconds (mock timers)
  - [ ] Manual refresh button triggers a data fetch
  - [ ] "Last refreshed" timestamp updates after each refresh
  - [ ] Loading skeletons display during initial fetch
  - [ ] Error message displays when API fetch fails
  - [ ] Tab navigation switches between real-time and trends views
  - [ ] "View all tickets" link points to /tickets
  - [ ] Time durations format correctly (e.g., 135 minutes → "2h 15m")
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- DashboardPage loads and displays real-time KPIs and queue
- Auto-refresh works without memory leaks (interval cleared on unmount)
- Page is responsive on desktop screens
- Loading and error states render correctly
