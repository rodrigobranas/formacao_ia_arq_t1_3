---
status: completed
title: Build TrendsTab with historical charts
type: frontend
complexity: medium
dependencies:
    - task_04
    - task_05
---

# Task 7: Build TrendsTab with historical charts

## Overview

Build the TrendsTab component that renders historical trend charts using Recharts. This tab provides operations managers with time-series analysis of ticket volume, resolution time trends, and distribution by type. It is accessed via the tab navigation in DashboardPage and fetches data with a `period` query parameter.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST render a time range selector with options: 7d, 30d, 90d
- MUST render a "Ticket Volume Over Time" line chart showing new tickets per day
- MUST render a "Resolution Time Trend" line chart showing average resolution hours per day
- MUST render a "Tickets by Type" horizontal bar chart showing volume per ticket type
- MUST fetch data from `GET /api/dashboard/metrics?period=<selected>` when the tab is activated or period changes
- MUST use Recharts components: `LineChart`, `BarChart`, `ResponsiveContainer`, `XAxis`, `YAxis`, `Tooltip`, `CartesianGrid`
- MUST show loading state while trend data is being fetched
- MUST show empty state when no trend data is available for the selected period
- MUST use Tailwind styling consistent with the rest of the dashboard
- MUST format dates on X-axis as short format (e.g., "Apr 1", "Apr 2")
- MUST format resolution time values with "h" suffix (e.g., "4.5h")
</requirements>

## Subtasks
- [x] 7.1 Create the TrendsTab component with time range selector (7d, 30d, 90d)
- [x] 7.2 Implement data fetching with period parameter
- [x] 7.3 Render ticket volume line chart with Recharts
- [x] 7.4 Render resolution time trend line chart with Recharts
- [x] 7.5 Render tickets-by-type horizontal bar chart with Recharts
- [x] 7.6 Add loading and empty states
- [x] 7.7 Write component tests for TrendsTab

## Implementation Details

Create `packages/frontend/src/pages/TrendsTab.tsx`. This component receives trend data from DashboardPage or fetches it independently when the tab is activated. Use Recharts `ResponsiveContainer` for responsive chart sizing. See TechSpec "Core Interfaces" section for the trend data types (`TrendDataPoint`, `ResolutionTrendPoint`, `TicketsByTypePoint`).

### Relevant Files
- `packages/frontend/src/types/types.ts` — Dashboard trend types to use
- `packages/frontend/src/pages/TicketsPage.tsx` — Data fetching pattern reference
- `packages/frontend/src/components/ui/skeleton.tsx` — Loading skeleton component
- `packages/frontend/src/store/AuthContext.tsx` — Auth context for authenticated fetch

### Dependent Files
- `packages/frontend/src/pages/DashboardPage.tsx` (task_06) — Will render this component within the trends tab

### Related ADRs
- [ADR-002: Charting Library — Recharts](../adrs/adr-002.md) — This task uses Recharts for all chart rendering
- [ADR-004: API Design — Single Metrics Endpoint](../adrs/adr-004.md) — Fetches with period param from the single endpoint

## Deliverables
- `packages/frontend/src/pages/TrendsTab.tsx` component with 3 charts
- Unit tests with 80%+ coverage **(REQUIRED)**

## Tests
- Unit tests:
  - [ ] TrendsTab renders time range selector with 7d, 30d, 90d options
  - [ ] Default selected period is 7d
  - [ ] Changing period triggers a new data fetch with updated period param
  - [ ] Ticket volume line chart renders with provided data points
  - [ ] Resolution time line chart renders with provided data points
  - [ ] Tickets-by-type bar chart renders with provided type data
  - [ ] Loading skeletons display while data is being fetched
  - [ ] Empty state renders when no trend data exists for the period
  - [ ] X-axis dates format as short date (e.g., "Apr 1")
  - [ ] Charts use ResponsiveContainer for responsive sizing
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Three charts render correctly with fetched data
- Time range selector changes trigger data refresh
- Loading and empty states work correctly
- Charts are responsive to container width
