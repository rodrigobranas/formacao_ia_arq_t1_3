import { getKpis, getQueueSummary, getTrends, getDashboardMetrics } from "./dashboardService";

const mockOne = jest.fn();
const mockOneOrNone = jest.fn();
const mockManyOrNone = jest.fn();

jest.mock("../data/database", () => ({
  db: {
    one: (...args: unknown[]) => mockOne(...args),
    oneOrNone: (...args: unknown[]) => mockOneOrNone(...args),
    manyOrNone: (...args: unknown[]) => mockManyOrNone(...args),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getKpis", () => {
  it("returns all 6 KPIs with correct values when tickets exist", async () => {
    mockOne.mockResolvedValueOnce({
      openTickets: "10",
      unassignedTickets: "3",
      closedToday: "5",
      newToday: "7",
    });
    mockOneOrNone.mockResolvedValueOnce({
      id: 1,
      code: "TK-ABC12345",
      name: "Old ticket",
      createdAt: "2026-04-06T10:00:00Z",
      ageMinutes: "120.5",
    });
    mockOneOrNone.mockResolvedValueOnce({ avgHours: "4.567" });

    const result = await getKpis(1);

    expect(result.openTickets).toBe(10);
    expect(result.unassignedTickets).toBe(3);
    expect(result.closedToday).toBe(5);
    expect(result.newToday).toBe(7);
    expect(result.oldestWaitingTicket).toEqual({
      id: 1,
      code: "TK-ABC12345",
      name: "Old ticket",
      createdAt: "2026-04-06T10:00:00Z",
      ageMinutes: 121,
    });
    expect(result.avgResolutionTimeHours).toBe(4.57);
  });

  it("returns zeros and nulls when no tickets exist", async () => {
    mockOne.mockResolvedValueOnce({
      openTickets: "0",
      unassignedTickets: "0",
      closedToday: "0",
      newToday: "0",
    });
    mockOneOrNone.mockResolvedValueOnce(null);
    mockOneOrNone.mockResolvedValueOnce({ avgHours: null });

    const result = await getKpis(1);

    expect(result.openTickets).toBe(0);
    expect(result.unassignedTickets).toBe(0);
    expect(result.closedToday).toBe(0);
    expect(result.newToday).toBe(0);
    expect(result.oldestWaitingTicket).toBeNull();
    expect(result.avgResolutionTimeHours).toBeNull();
  });

  it("returns null for avgResolutionTimeHours when no closed tickets exist", async () => {
    mockOne.mockResolvedValueOnce({
      openTickets: "5",
      unassignedTickets: "2",
      closedToday: "0",
      newToday: "3",
    });
    mockOneOrNone.mockResolvedValueOnce({
      id: 1,
      code: "TK-XYZ",
      name: "Ticket",
      createdAt: "2026-04-07T00:00:00Z",
      ageMinutes: "60",
    });
    mockOneOrNone.mockResolvedValueOnce({ avgHours: null });

    const result = await getKpis(1);

    expect(result.avgResolutionTimeHours).toBeNull();
    expect(result.openTickets).toBe(5);
  });

  it("returns null for oldestWaitingTicket when no open tickets exist", async () => {
    mockOne.mockResolvedValueOnce({
      openTickets: "0",
      unassignedTickets: "0",
      closedToday: "2",
      newToday: "0",
    });
    mockOneOrNone.mockResolvedValueOnce(null);
    mockOneOrNone.mockResolvedValueOnce({ avgHours: "2.0" });

    const result = await getKpis(1);

    expect(result.oldestWaitingTicket).toBeNull();
    expect(result.avgResolutionTimeHours).toBe(2);
  });
});

describe("getQueueSummary", () => {
  it("returns tickets sorted by created_at ascending", async () => {
    mockManyOrNone.mockResolvedValueOnce([
      { id: 1, code: "TK-001", name: "First", status: "new", assignedToName: null, ticketTypeName: "Dúvida", createdAt: "2026-04-05T10:00:00Z", ageMinutes: "200" },
      { id: 2, code: "TK-002", name: "Second", status: "assigned", assignedToName: "Agent A", ticketTypeName: "Inconsistência", createdAt: "2026-04-06T10:00:00Z", ageMinutes: "100" },
    ]);

    const result = await getQueueSummary(1);

    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
    expect(result[0].ageMinutes).toBe(200);
    expect(result[1].ageMinutes).toBe(100);
  });

  it("limits results to 15 items", async () => {
    const queryStr = mockManyOrNone.mockResolvedValueOnce([]);
    await getQueueSummary(1);

    const callArgs = mockManyOrNone.mock.calls[0];
    expect(callArgs[1]).toContain(15);
  });

  it("includes joined agent name and ticket type name", async () => {
    mockManyOrNone.mockResolvedValueOnce([
      { id: 1, code: "TK-001", name: "Ticket", status: "assigned", assignedToName: "John Doe", ticketTypeName: "Sugestão", createdAt: "2026-04-07T00:00:00Z", ageMinutes: "30" },
    ]);

    const result = await getQueueSummary(1);

    expect(result[0].assignedToName).toBe("John Doe");
    expect(result[0].ticketTypeName).toBe("Sugestão");
  });

  it("returns null for assignedToName when unassigned", async () => {
    mockManyOrNone.mockResolvedValueOnce([
      { id: 1, code: "TK-001", name: "Ticket", status: "new", assignedToName: null, ticketTypeName: "Dúvida", createdAt: "2026-04-07T00:00:00Z", ageMinutes: "10" },
    ]);

    const result = await getQueueSummary(1);

    expect(result[0].assignedToName).toBeNull();
  });
});

describe("getTrends", () => {
  it("returns volume grouped by date for 7d period", async () => {
    const volumeData = [
      { date: "2026-04-01", count: 5 },
      { date: "2026-04-02", count: 8 },
    ];
    mockManyOrNone
      .mockResolvedValueOnce(volumeData)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await getTrends(1, "7d");

    expect(result.volume).toEqual(volumeData);
    const callArgs = mockManyOrNone.mock.calls[0];
    expect(callArgs[1]).toContain(7);
  });

  it("returns resolution time grouped by date", async () => {
    const resolutionData = [
      { date: "2026-04-01", avgHours: 3.5 },
      { date: "2026-04-02", avgHours: 2.1 },
    ];
    mockManyOrNone
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(resolutionData)
      .mockResolvedValueOnce([]);

    const result = await getTrends(1, "30d");

    expect(result.resolutionTime).toEqual(resolutionData);
  });

  it("returns ticket counts grouped by type name", async () => {
    const byTypeData = [
      { typeName: "Dúvida", count: 10 },
      { typeName: "Inconsistência", count: 5 },
    ];
    mockManyOrNone
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(byTypeData);

    const result = await getTrends(1, "90d");

    expect(result.byType).toEqual(byTypeData);
    const callArgs = mockManyOrNone.mock.calls[2];
    expect(callArgs[1]).toContain(90);
  });
});

describe("getDashboardMetrics", () => {
  const mockKpiResponse = {
    openTickets: "2",
    unassignedTickets: "1",
    closedToday: "0",
    newToday: "1",
  };

  beforeEach(() => {
    mockOne.mockResolvedValue(mockKpiResponse);
    mockOneOrNone.mockResolvedValue(null);
    mockManyOrNone.mockResolvedValue([]);
  });

  it("excludes trends when period is not provided", async () => {
    const result = await getDashboardMetrics(1);

    expect(result.trends).toBeUndefined();
    expect(result.kpis).toBeDefined();
    expect(result.queue).toBeDefined();
    expect(result.refreshedAt).toBeDefined();
  });

  it("includes trends when period is '7d'", async () => {
    const result = await getDashboardMetrics(1, "7d");

    expect(result.trends).toBeDefined();
    expect(result.trends).toHaveProperty("volume");
    expect(result.trends).toHaveProperty("resolutionTime");
    expect(result.trends).toHaveProperty("byType");
  });

  it("includes refreshedAt as ISO timestamp", async () => {
    const before = new Date().toISOString();
    const result = await getDashboardMetrics(1);
    const after = new Date().toISOString();

    expect(result.refreshedAt >= before).toBe(true);
    expect(result.refreshedAt <= after).toBe(true);
  });
});
