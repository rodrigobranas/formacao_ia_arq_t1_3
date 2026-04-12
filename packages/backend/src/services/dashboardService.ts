import { db } from "../data/database";
import {
  DashboardKpis,
  DashboardMetrics,
  OldestTicket,
  QueueItem,
  TrendDataPoint,
  ResolutionTrendPoint,
  TicketsByTypePoint,
} from "./dashboardTypes";

type Period = "7d" | "30d" | "90d";

const PERIOD_DAYS: Record<Period, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const QUEUE_LIMIT = 15;

export async function getKpis(organizationId: number): Promise<DashboardKpis> {
  const [counts, oldestWaitingTicket, avgResolution] = await Promise.all([
    db.one<{ openTickets: string; unassignedTickets: string; closedToday: string; newToday: string }>(
      `SELECT
        COUNT(*) FILTER (WHERE status IN ('new', 'assigned')) AS "openTickets",
        COUNT(*) FILTER (WHERE status = 'new' AND assigned_to_id IS NULL) AS "unassignedTickets",
        COUNT(*) FILTER (WHERE status = 'closed' AND updated_at >= CURRENT_DATE) AS "closedToday",
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) AS "newToday"
      FROM tickets
      WHERE organization_id = $1`,
      [organizationId],
    ),
    db.oneOrNone<OldestTicket>(
      `SELECT id, code, name, created_at AS "createdAt",
              EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 AS "ageMinutes"
       FROM tickets
       WHERE organization_id = $1 AND status IN ('new', 'assigned')
       ORDER BY created_at ASC
       LIMIT 1`,
      [organizationId],
    ),
    db.oneOrNone<{ avgHours: string | null }>(
      `SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) AS "avgHours"
       FROM tickets
       WHERE organization_id = $1 AND status = 'closed'`,
      [organizationId],
    ),
  ]);
  return {
    openTickets: Number(counts.openTickets),
    unassignedTickets: Number(counts.unassignedTickets),
    closedToday: Number(counts.closedToday),
    newToday: Number(counts.newToday),
    oldestWaitingTicket: oldestWaitingTicket
      ? { ...oldestWaitingTicket, ageMinutes: Math.round(Number(oldestWaitingTicket.ageMinutes)) }
      : null,
    avgResolutionTimeHours: avgResolution?.avgHours !== null && avgResolution?.avgHours !== undefined
      ? Math.round(Number(avgResolution.avgHours) * 100) / 100
      : null,
  };
}

export async function getQueueSummary(organizationId: number): Promise<QueueItem[]> {
  const rows = await db.manyOrNone<QueueItem>(
    `SELECT t.id, t.code, t.name, t.status,
            u.name AS "assignedToName",
            tt.name AS "ticketTypeName",
            t.created_at AS "createdAt",
            EXTRACT(EPOCH FROM (NOW() - t.created_at)) / 60 AS "ageMinutes"
     FROM tickets t
     LEFT JOIN users u ON u.id = t.assigned_to_id
     LEFT JOIN ticket_types tt ON tt.id = t.ticket_type_id
     WHERE t.organization_id = $1 AND t.status IN ('new', 'assigned')
     ORDER BY t.created_at ASC
     LIMIT $2`,
    [organizationId, QUEUE_LIMIT],
  );
  return rows.map((row) => ({
    ...row,
    ageMinutes: Math.round(Number(row.ageMinutes)),
  }));
}

export async function getTrends(
  organizationId: number,
  period: Period,
): Promise<{ volume: TrendDataPoint[]; resolutionTime: ResolutionTrendPoint[]; byType: TicketsByTypePoint[] }> {
  const days = PERIOD_DAYS[period];
  const [volume, resolutionTime, byType] = await Promise.all([
    db.manyOrNone<TrendDataPoint>(
      `SELECT DATE(created_at)::text AS date, COUNT(*)::int AS count
       FROM tickets
       WHERE organization_id = $1 AND created_at >= CURRENT_DATE - $2::int
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [organizationId, days],
    ),
    db.manyOrNone<ResolutionTrendPoint>(
      `SELECT DATE(updated_at)::text AS date,
              ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600)::numeric, 2)::float AS "avgHours"
       FROM tickets
       WHERE organization_id = $1 AND status = 'closed' AND updated_at >= CURRENT_DATE - $2::int
       GROUP BY DATE(updated_at)
       ORDER BY date`,
      [organizationId, days],
    ),
    db.manyOrNone<TicketsByTypePoint>(
      `SELECT tt.name AS "typeName", COUNT(*)::int AS count
       FROM tickets t
       JOIN ticket_types tt ON tt.id = t.ticket_type_id
       WHERE t.organization_id = $1 AND t.created_at >= CURRENT_DATE - $2::int
       GROUP BY tt.name
       ORDER BY count DESC`,
      [organizationId, days],
    ),
  ]);
  return { volume, resolutionTime, byType };
}

export async function getDashboardMetrics(
  organizationId: number,
  period?: string,
): Promise<DashboardMetrics> {
  const [kpis, queue] = await Promise.all([
    getKpis(organizationId),
    getQueueSummary(organizationId),
  ]);
  const result: DashboardMetrics = {
    kpis,
    queue,
    refreshedAt: new Date().toISOString(),
  };
  if (period && period in PERIOD_DAYS) {
    result.trends = await getTrends(organizationId, period as Period);
  }
  return result;
}
