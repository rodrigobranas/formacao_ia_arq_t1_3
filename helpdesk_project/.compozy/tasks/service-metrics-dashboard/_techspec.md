# TechSpec: Service Metrics Dashboard

## Executive Summary

This TechSpec defines the implementation of a real-time service metrics dashboard that replaces the current placeholder DashboardPage. The architecture adds a metrics aggregation layer to the existing backend (Express + pg-promise + PostgreSQL) and a new dashboard UI to the frontend (React + Tailwind + shadcn/ui + Recharts).

**Key architectural decisions:**
- A single `GET /api/dashboard/metrics` endpoint serves all dashboard data (KPIs, queue summary, and trend charts) via on-the-fly SQL aggregation queries against the existing `tickets` table — no new tables or scheduled jobs.
- The frontend uses Recharts for chart rendering and `setInterval` polling every 30 seconds for auto-refresh, consistent with existing codebase patterns.

**Primary trade-off:** On-the-fly SQL aggregation is simpler and always accurate but grows linearly with ticket volume. This is acceptable for the current scale and can be migrated to pre-computed metrics if needed in the future.

## System Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React)                                       │
│  ┌───────────────────────┐  ┌────────────────────────┐  │
│  │  DashboardPage        │  │  TrendsTab             │  │
│  │  ├─ KpiCards          │  │  ├─ VolumeChart         │  │
│  │  ├─ TicketQueue       │  │  ├─ ResolutionChart     │  │
│  │  └─ RefreshIndicator  │  │  └─ TicketsByTypeChart  │  │
│  └───────────┬───────────┘  └───────────┬────────────┘  │
│              │ fetch (30s poll)          │ fetch (on tab) │
└──────────────┼──────────────────────────┼───────────────┘
               │                          │
               ▼                          ▼
┌─────────────────────────────────────────────────────────┐
│  Backend (Express)                                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │  dashboardRoutes.ts                              │   │
│  │  GET /api/dashboard/metrics?period=7d|30d|90d    │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                               │
│  ┌──────────────────────▼───────────────────────────┐   │
│  │  dashboardService.ts                             │   │
│  │  ├─ getDashboardMetrics(organizationId, period?) │   │
│  │  ├─ getKpis(organizationId)                      │   │
│  │  ├─ getQueueSummary(organizationId)              │   │
│  │  └─ getTrends(organizationId, period)            │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                               │
│  ┌──────────────────────▼───────────────────────────┐   │
│  │  PostgreSQL (existing tickets table)             │   │
│  │  + new indexes on (org_id, status, created_at)   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Data flow:**
1. Frontend calls `GET /api/dashboard/metrics` every 30 seconds (real-time tab) or on tab switch with `?period=` (trends tab).
2. `dashboardRoutes.ts` validates the request and extracts `organizationId` from the JWT via `authMiddleware`.
3. `dashboardService.ts` runs aggregation queries against the `tickets` table and returns structured data.
4. Frontend renders KPI cards, queue table, and Recharts charts from the response.

## Implementation Design

### Core Interfaces

**Backend — Dashboard Service Interface:**

```typescript
interface DashboardKpis {
  openTickets: number;
  unassignedTickets: number;
  oldestWaitingTicket: OldestTicket | null;
  closedToday: number;
  avgResolutionTimeHours: number | null;
  newToday: number;
}

interface OldestTicket {
  id: number;
  code: string;
  name: string;
  createdAt: string;
  ageMinutes: number;
}

interface QueueItem {
  id: number;
  code: string;
  name: string;
  status: string;
  assignedToName: string | null;
  ticketTypeName: string | null;
  createdAt: string;
  ageMinutes: number;
}

interface TrendDataPoint {
  date: string;
  count: number;
}

interface ResolutionTrendPoint {
  date: string;
  avgHours: number;
}

interface TicketsByTypePoint {
  typeName: string;
  count: number;
}

interface DashboardMetrics {
  kpis: DashboardKpis;
  queue: QueueItem[];
  trends?: {
    volume: TrendDataPoint[];
    resolutionTime: ResolutionTrendPoint[];
    byType: TicketsByTypePoint[];
  };
  refreshedAt: string;
}
```

**Frontend — Component Props:**

```typescript
interface KpiCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}

interface TicketQueueProps {
  items: QueueItem[];
}
```

### Data Models

No new database tables are required. All metrics are derived from existing tables:

- **`tickets`** — source for all KPIs and trends (status, created_at, updated_at, assigned_to_id, ticket_type_id, organization_id)
- **`ticket_types`** — joined for "tickets by type" chart (name)
- **`users`** — joined for assigned agent name in queue summary (name)

**New database indexes** (added to `init.sql` or via migration):

```sql
CREATE INDEX idx_tickets_org_status ON tickets (organization_id, status);
CREATE INDEX idx_tickets_org_created ON tickets (organization_id, created_at);
CREATE INDEX idx_tickets_org_status_created ON tickets (organization_id, status, created_at);
```

### API Endpoints

#### `GET /api/dashboard/metrics`

**Authentication:** Required (JWT via `authMiddleware`)

**Query parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | `"7d" \| "30d" \| "90d"` | No | If provided, includes trend data for the given period |

**Response (200):**

```json
{
  "kpis": {
    "openTickets": 24,
    "unassignedTickets": 8,
    "oldestWaitingTicket": {
      "id": 42,
      "code": "TK-ABC123",
      "name": "Connection issue",
      "createdAt": "2026-04-06T14:30:00Z",
      "ageMinutes": 1230
    },
    "closedToday": 12,
    "avgResolutionTimeHours": 4.5,
    "newToday": 15
  },
  "queue": [
    {
      "id": 42,
      "code": "TK-ABC123",
      "name": "Connection issue",
      "status": "new",
      "assignedToName": null,
      "ticketTypeName": "Inconsistência",
      "createdAt": "2026-04-06T14:30:00Z",
      "ageMinutes": 1230
    }
  ],
  "trends": {
    "volume": [
      { "date": "2026-04-01", "count": 18 },
      { "date": "2026-04-02", "count": 22 }
    ],
    "resolutionTime": [
      { "date": "2026-04-01", "avgHours": 3.2 },
      { "date": "2026-04-02", "avgHours": 5.1 }
    ],
    "byType": [
      { "typeName": "Dúvida", "count": 45 },
      { "typeName": "Inconsistência", "count": 30 }
    ]
  },
  "refreshedAt": "2026-04-07T10:30:00Z"
}
```

**Response (401):** Unauthorized — missing or invalid JWT.

**SQL queries overview:**

| KPI | Query pattern |
|-----|--------------|
| openTickets | `SELECT COUNT(*) FROM tickets WHERE organization_id = $1 AND status IN ('new', 'assigned')` |
| unassignedTickets | `SELECT COUNT(*) FROM tickets WHERE organization_id = $1 AND status = 'new' AND assigned_to_id IS NULL` |
| oldestWaitingTicket | `SELECT ... FROM tickets WHERE organization_id = $1 AND status IN ('new', 'assigned') ORDER BY created_at ASC LIMIT 1` |
| closedToday | `SELECT COUNT(*) FROM tickets WHERE organization_id = $1 AND status = 'closed' AND updated_at >= CURRENT_DATE` |
| avgResolutionTimeHours | `SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) FROM tickets WHERE organization_id = $1 AND status = 'closed'` |
| newToday | `SELECT COUNT(*) FROM tickets WHERE organization_id = $1 AND created_at >= CURRENT_DATE` |
| queue | `SELECT ... FROM tickets LEFT JOIN users ON ... LEFT JOIN ticket_types ON ... WHERE organization_id = $1 AND status IN ('new', 'assigned') ORDER BY created_at ASC LIMIT 15` |
| volume trend | `SELECT DATE(created_at) AS date, COUNT(*) FROM tickets WHERE organization_id = $1 AND created_at >= $2 GROUP BY DATE(created_at) ORDER BY date` |
| resolution trend | `SELECT DATE(updated_at) AS date, AVG(...) FROM tickets WHERE organization_id = $1 AND status = 'closed' AND updated_at >= $2 GROUP BY DATE(updated_at) ORDER BY date` |
| byType | `SELECT tt.name, COUNT(*) FROM tickets t JOIN ticket_types tt ON ... WHERE t.organization_id = $1 AND t.created_at >= $2 GROUP BY tt.name ORDER BY count DESC` |

## Impact Analysis

| Component | Impact Type | Description and Risk | Required Action |
|-----------|-------------|---------------------|-----------------|
| `packages/backend/src/routes/` | new | Add `dashboardRoutes.ts` with metrics endpoint | Create file, mount in `index.ts` |
| `packages/backend/src/services/` | new | Add `dashboardService.ts` with aggregation logic | Create file |
| `packages/backend/src/index.ts` | modified | Mount dashboard routes — low risk, additive change | Add route import and `app.use()` |
| `packages/frontend/src/pages/DashboardPage.tsx` | modified | Replace placeholder content with metrics dashboard — medium risk, full rewrite of existing page | Rewrite component |
| `packages/frontend/src/pages/` | new | Add `TrendsTab.tsx` for historical charts | Create file |
| `packages/frontend/src/components/ui/` | new | Add `KpiCard.tsx` reusable component | Create file |
| `packages/frontend/src/types/types.ts` | modified | Add dashboard metric interfaces — low risk, additive | Add types |
| `database/init.sql` | modified | Add indexes — low risk, additive | Add CREATE INDEX statements |
| `packages/frontend/package.json` | modified | Add `recharts` dependency | `npm install recharts` |

## Testing Approach

### Unit Tests

**Backend — `dashboardService.test.ts`:**
- Test each KPI computation function with stubbed database responses.
- Test `getQueueSummary` returns items sorted by `created_at` ascending, limited to 15.
- Test `getTrends` groups data correctly by date.
- Test edge cases: no tickets exist (all KPIs return 0 or null), no closed tickets (avg resolution time returns null).

**Frontend — `KpiCard.test.tsx`:**
- Test rendering of value, label, and icon.
- Test formatting of large numbers and time durations.

### Integration Tests

**Backend — `dashboardRoutes.test.ts`:**
- Test `GET /api/dashboard/metrics` returns 200 with correct structure.
- Test `GET /api/dashboard/metrics?period=7d` includes trend data.
- Test 401 response without authentication.
- Test that metrics are scoped to the authenticated user's organization (multi-tenancy isolation).

**Frontend — `DashboardPage.test.tsx`:**
- Test that KPI cards render with fetched data.
- Test that the queue table renders ticket rows.
- Test auto-refresh fires at the expected interval (mock timers).
- Test tab switch between real-time and trends views.

## Development Sequencing

### Build Order

1. **Database indexes** — no dependencies. Add indexes to `init.sql` for efficient aggregation queries.
2. **Backend types** — no dependencies. Define `DashboardKpis`, `QueueItem`, `TrendDataPoint`, `DashboardMetrics` interfaces.
3. **Dashboard service** — depends on steps 1, 2. Implement `dashboardService.ts` with SQL aggregation queries using pg-promise.
4. **Dashboard route** — depends on step 3. Create `dashboardRoutes.ts`, mount in `index.ts` behind `authMiddleware`.
5. **Backend tests** — depends on steps 3, 4. Write unit tests for the service and integration tests for the route.
6. **Frontend types** — depends on step 2. Add dashboard metric types to `types.ts` (mirror backend interfaces).
7. **Install Recharts** — no dependencies. Run `npm install recharts` in the frontend package.
8. **KpiCard component** — depends on steps 6, 7. Build reusable KPI card with shadcn/ui styling.
9. **DashboardPage rewrite** — depends on steps 6, 8. Replace placeholder with KPI cards + queue table + auto-refresh logic.
10. **TrendsTab component** — depends on steps 6, 7. Build trend charts (line charts, bar chart) using Recharts.
11. **Frontend tests** — depends on steps 8, 9, 10. Write component tests for KpiCard, DashboardPage, and TrendsTab.

### Technical Dependencies

- **Recharts installation**: Must be installed before any chart component development (step 7).
- **Database indexes**: Should be applied before load testing, but development can proceed without them.
- **No blocking external dependencies**: All implementation uses existing infrastructure (PostgreSQL, Express, React).

## Monitoring and Observability

- **Metrics endpoint latency**: Log response time for `GET /api/dashboard/metrics`. Alert if p95 exceeds 2 seconds.
- **Query performance**: Log individual SQL query durations within `dashboardService`. Identify slow queries early.
- **Refresh errors**: Frontend logs failed fetch attempts. Show "Last refreshed X minutes ago" warning if refresh fails for 3+ consecutive cycles.
- **Error rate**: Monitor 5xx responses on the metrics endpoint. Alert if error rate exceeds 1% over a 5-minute window.

## Technical Considerations

### Key Decisions

- **Recharts over Chart.js/Tremor**: Chose Recharts for React-native composability and alignment with the existing component-driven architecture. Trade-off: heatmap requires custom implementation since Recharts lacks a built-in heatmap type (deferred to Phase 2).
- **On-the-fly SQL over pre-computed tables**: Chose live aggregation for simplicity and data freshness. Trade-off: query cost grows with ticket volume; may need indexes or materialized views at scale.
- **Single endpoint over granular endpoints**: Chose one endpoint for simplicity. Trade-off: trend data is refetched on every real-time poll unless the `period` parameter is omitted.
- **setInterval polling over React Query**: Chose simple polling to match existing codebase patterns. Trade-off: no built-in caching or deduplication; acceptable for a single-page use case.

### Known Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Slow aggregation queries on large ticket tables | Low (current scale) | Add composite indexes; monitor query duration; migrate to pre-computed metrics if p95 > 1s |
| Stale `updated_at` for "closed today" count | Medium | Ensure ticket close operation updates `updated_at` — verify in `ticketService.ts` |
| Recharts bundle size impact | Low | Recharts is tree-shakeable; import only used chart types (LineChart, BarChart, ResponsiveContainer) |
| Auto-refresh causing excessive DB load with many concurrent users | Low | 30s interval is conservative; metrics queries are read-only and use indexes |

## Architecture Decision Records

- [ADR-001: Dashboard Product Approach — Real-Time Operations Hub](adrs/adr-001.md) — Chose real-time operations hub over analytics-first or dual-mode approaches, prioritizing live queue visibility and daily usage.
- [ADR-002: Charting Library — Recharts](adrs/adr-002.md) — Chose Recharts over Chart.js and Tremor for React-native composability and lightweight integration.
- [ADR-003: Metrics Data Strategy — On-the-fly SQL Aggregation](adrs/adr-003.md) — Chose live SQL aggregation over pre-computed tables for simplicity and data freshness.
- [ADR-004: API Design — Single Metrics Endpoint with Polling Refresh](adrs/adr-004.md) — Chose single endpoint with 30s setInterval polling over granular endpoints or React Query.
