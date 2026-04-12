import type {
  DashboardKpis,
  DashboardMetrics,
  OldestTicket,
  QueueItem,
  ResolutionTrendPoint,
  TicketsByTypePoint,
  TrendDataPoint,
} from "./types";

describe("Dashboard Types (Frontend)", () => {
  it("should allow a valid DashboardMetrics object with all fields", () => {
    const oldestTicket: OldestTicket = {
      id: 42,
      code: "TK-ABC123",
      name: "Connection issue",
      createdAt: "2026-04-06T14:30:00Z",
      ageMinutes: 1230,
    };

    const kpis: DashboardKpis = {
      openTickets: 24,
      unassignedTickets: 8,
      oldestWaitingTicket: oldestTicket,
      closedToday: 12,
      avgResolutionTimeHours: 4.5,
      newToday: 15,
    };

    const queue: QueueItem[] = [
      {
        id: 42,
        code: "TK-ABC123",
        name: "Connection issue",
        status: "new",
        assignedToName: null,
        ticketTypeName: "Inconsistência",
        createdAt: "2026-04-06T14:30:00Z",
        ageMinutes: 1230,
      },
    ];

    const volume: TrendDataPoint[] = [
      { date: "2026-04-01", count: 18 },
    ];

    const resolutionTime: ResolutionTrendPoint[] = [
      { date: "2026-04-01", avgHours: 3.2 },
    ];

    const byType: TicketsByTypePoint[] = [
      { typeName: "Dúvida", count: 45 },
    ];

    const metrics: DashboardMetrics = {
      kpis,
      queue,
      trends: { volume, resolutionTime, byType },
      refreshedAt: "2026-04-07T10:30:00Z",
    };

    expect(metrics.kpis.openTickets).toBe(24);
    expect(metrics.queue).toHaveLength(1);
    expect(metrics.trends?.volume).toHaveLength(1);
    expect(metrics.refreshedAt).toBe("2026-04-07T10:30:00Z");
  });

  it("should allow DashboardMetrics with trends undefined", () => {
    const metrics: DashboardMetrics = {
      kpis: {
        openTickets: 0,
        unassignedTickets: 0,
        oldestWaitingTicket: null,
        closedToday: 0,
        avgResolutionTimeHours: null,
        newToday: 0,
      },
      queue: [],
      refreshedAt: "2026-04-07T10:30:00Z",
    };

    expect(metrics.trends).toBeUndefined();
  });

  it("should allow oldestWaitingTicket to be null in DashboardKpis", () => {
    const kpis: DashboardKpis = {
      openTickets: 0,
      unassignedTickets: 0,
      oldestWaitingTicket: null,
      closedToday: 5,
      avgResolutionTimeHours: 2.3,
      newToday: 3,
    };

    expect(kpis.oldestWaitingTicket).toBeNull();
  });

  it("should allow avgResolutionTimeHours to be null in DashboardKpis", () => {
    const kpis: DashboardKpis = {
      openTickets: 10,
      unassignedTickets: 4,
      oldestWaitingTicket: {
        id: 1,
        code: "TK-001",
        name: "Test ticket",
        createdAt: "2026-04-07T08:00:00Z",
        ageMinutes: 60,
      },
      closedToday: 0,
      avgResolutionTimeHours: null,
      newToday: 2,
    };

    expect(kpis.avgResolutionTimeHours).toBeNull();
  });
});
