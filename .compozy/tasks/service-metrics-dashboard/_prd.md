# PRD: Service Metrics Dashboard

## Overview

The Service Metrics Dashboard replaces the current placeholder welcome page with a real-time operations hub for monitoring ticket activity and service performance. Operations managers currently lack visibility into queue status, response times, and workload distribution — they must manually check ticket lists and mentally aggregate the data.

This dashboard solves that by providing an auto-refreshing, at-a-glance view of live queue health, key performance indicators, and historical trends. It is designed to become the daily "home screen" for operations managers, enabling faster identification of bottlenecks and more proactive ticket management.

## Goals

- **Become the default daily tool**: Achieve consistent daily active usage by operations managers within 4 weeks of launch.
- **Enable real-time visibility**: Operations managers can see current queue status (open, unassigned, oldest ticket) without navigating to the ticket list.
- **Surface actionable trends**: Provide historical charts that reveal patterns in ticket volume, response times, and resolution rates over configurable time periods.
- **Reduce time to awareness**: Managers identify spikes, bottlenecks, or unassigned backlogs within seconds of opening the dashboard, not minutes.

## User Stories

### Operations Manager

- As an operations manager, I want to see how many tickets are currently open, unassigned, and in progress so that I can quickly assess queue health.
- As an operations manager, I want to know the longest waiting ticket and its age so that I can prioritize it or escalate.
- As an operations manager, I want to see how many tickets were opened and closed today so that I can gauge the team's throughput.
- As an operations manager, I want to view ticket volume trends over the past 7, 30, or 90 days so that I can identify patterns and plan staffing.
- As an operations manager, I want to see average resolution time trends so that I can detect when service quality is degrading.
- As an operations manager, I want to see ticket distribution by type and status so that I can understand which categories drive the most volume.
- As an operations manager, I want the dashboard to refresh automatically so that I always see current data without manual reloads.

## Core Features

### 1. Real-Time KPI Cards

A horizontal row of 4-6 large KPI cards at the top of the dashboard, each displaying:
- Current value (large, prominent number)
- Comparison delta vs. previous period (arrow + percentage)
- Color-coded status (green/yellow/red thresholds where applicable)

**Suggested KPIs:**
| KPI | Description |
|-----|-------------|
| Open Tickets | Total tickets currently in "new" or "assigned" status |
| Unassigned Tickets | Tickets in "new" status with no agent assigned |
| Oldest Waiting Ticket | Age (in hours/minutes) of the longest-unresolved open ticket |
| Tickets Closed Today | Count of tickets moved to "closed" status today |
| Avg. Resolution Time | Average time from ticket creation to closure (rolling period) |
| New Tickets Today | Count of tickets created today |

### 2. Live Ticket Queue Summary

A central section showing a prioritized summary of the current ticket queue:
- Tickets sorted by age (oldest first) or urgency
- Each row shows ticket code, subject, status, assigned agent (or "Unassigned"), and age
- Visual indicators for tickets approaching or exceeding expected response times
- Clickable rows that navigate to the ticket detail page
- Limited to the top 10-15 most urgent tickets, with a "View all" link to the full tickets page

### 3. Historical Trend Charts (Secondary Tab)

A dedicated "Trends" tab providing time-series analysis:

**Suggested Charts:**
| Chart | Type | Description |
|-------|------|-------------|
| Ticket Volume Over Time | Line chart | New tickets created per day/week over the selected period |
| Resolution Time Trend | Line chart | Average resolution time per day/week, showing improvement or degradation |
| Tickets by Status | Stacked bar chart | Breakdown of tickets by status (new/assigned/closed) per day/week |
| Tickets by Type | Horizontal bar chart | Volume distribution across ticket types for the selected period |
| Peak Hours Heatmap | Heatmap | Ticket creation volume by day of week × hour of day, highlighting busy periods |

**Time range selector**: Global filter for 7 days, 30 days, 90 days, or custom range, applied to all charts in the tab.

### 4. Auto-Refresh

The real-time view (KPI cards + queue summary) updates automatically on a regular interval without requiring manual page reload. A subtle indicator shows the last refresh timestamp.

## User Experience

### First Contact

When an operations manager logs in, the dashboard is the landing page. The real-time KPI cards load immediately, providing an instant health check. The live queue summary loads below, showing the most urgent tickets. No onboarding wizard is needed — the layout is self-explanatory.

### Daily Use Flow

1. Manager opens the app → Dashboard loads with current KPI cards and live queue.
2. Manager scans KPI cards for anomalies (high unassigned count, spike in new tickets, aging ticket).
3. If an issue is spotted, manager clicks a ticket in the queue summary → navigates to ticket detail to take action (assign, comment, escalate).
4. For weekly reviews, manager switches to the "Trends" tab → selects 7d or 30d range → reviews volume and resolution time charts.
5. Manager identifies patterns (e.g., Monday spike, slow resolution for a specific ticket type) → takes operational action outside the dashboard.

### UI/UX Considerations

- **Layout**: Three-zone design — KPI cards (top), live queue (center), with a tab bar to switch to trends.
- **Responsiveness**: Must work on desktop screens (primary) and degrade gracefully on tablets.
- **Color coding**: Use red/yellow/green sparingly and only for threshold-based KPIs (e.g., unassigned count > threshold = red). Avoid excessive color.
- **Typography**: Large, bold numbers for KPI values. Smaller muted text for labels and deltas.
- **Accessibility**: Ensure color is not the only indicator — use icons (arrows, warning symbols) alongside color.
- **Loading states**: Skeleton loaders for KPI cards and charts during initial load and refresh.

## Non-Goals (Out of Scope)

- **Agent-facing personal performance dashboard**: This MVP targets operations managers only, not individual agent views.
- **Custom dashboard builder**: Users cannot rearrange, add, or remove widgets. The layout is fixed for MVP.
- **Alerting and notifications**: No email/Slack alerts when thresholds are breached. Managers must check the dashboard.
- **CSAT or NPS scores**: No customer satisfaction survey integration in this phase.
- **SLA configuration and management**: SLA targets and breach rules are not part of this feature.
- **Export or report generation**: No PDF/CSV export of dashboard data.
- **Real-time WebSocket streaming**: Auto-refresh via polling is sufficient for MVP; WebSocket upgrade is deferred.

## Phased Rollout Plan

### MVP (Phase 1)

**Features included:**
- 4-6 real-time KPI cards (open, unassigned, oldest waiting, closed today, avg resolution time, new today)
- Live ticket queue summary (top 10-15 tickets sorted by age)
- Auto-refresh on configurable interval
- Historical trends tab with 3 charts: ticket volume over time (line), resolution time trend (line), tickets by type (bar)
- Time range selector (7d, 30d, 90d)

**Success criteria to proceed to Phase 2:**
- Dashboard achieves >60% daily active usage among operations managers within 4 weeks
- Page load time under 3 seconds for initial render
- No critical bugs or data accuracy issues reported in first 2 weeks

### Phase 2

**Additional features:**
- Tickets by status stacked bar chart
- Peak hours heatmap
- Comparison deltas on KPI cards (vs. previous period)
- Agent workload distribution chart (tickets per agent)
- Drill-down from KPI cards to filtered ticket lists

**Success criteria to proceed to Phase 3:**
- Trends tab usage reaches >30% weekly active usage
- Operations managers report reduced time to identify bottlenecks (qualitative feedback)

### Phase 3

**Full feature set:**
- SLA compliance tracking (gauges with target thresholds)
- Agent performance comparison views
- Custom date range picker
- Dashboard data export (CSV)
- Executive summary view (simplified, high-level version for leadership)

**Long-term success criteria:**
- Dashboard is the most-visited page in the application
- Average session duration on dashboard exceeds 2 minutes

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily Active Usage | >60% of operations managers use the dashboard daily | Track page views per user per day |
| Page Load Time | <3 seconds for initial render | Frontend performance monitoring |
| Refresh Reliability | >99.5% successful auto-refresh cycles | Error rate monitoring on metrics endpoints |
| Time on Page | >2 minutes average session | Analytics tracking |
| Ticket List Navigation Reduction | 30% fewer direct visits to the tickets list page | Compare pre/post dashboard launch |

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Managers don't adopt the dashboard | Low daily usage, wasted effort | Make it the default landing page; ensure data is accurate and valuable from day one |
| Data accuracy concerns | Managers distrust the dashboard and revert to manual checks | Validate aggregation logic thoroughly; show "last refreshed" timestamp for transparency |
| Information overload | Too many metrics overwhelm instead of inform | Start with 4-6 KPIs only; add more in Phase 2 based on feedback |
| Stale data perception | If refresh interval is too long, managers feel the data is outdated | Show clear refresh indicator; allow manual refresh button |

## Architecture Decision Records

- [ADR-001: Dashboard Product Approach — Real-Time Operations Hub](adrs/adr-001.md) — Chose real-time operations hub over analytics-first or dual-mode approaches, prioritizing live queue visibility and daily usage.

## Open Questions

1. What specific thresholds should trigger yellow/red color coding on KPI cards (e.g., unassigned tickets > 5 = yellow, > 10 = red)? Needs input from operations team.
2. What is the acceptable auto-refresh interval? (e.g., every 30 seconds, every 60 seconds, every 5 minutes)
3. Should the "oldest waiting ticket" KPI count only business hours or wall-clock time?
4. Are there specific ticket types that should be excluded from metrics (e.g., internal/test tickets)?
