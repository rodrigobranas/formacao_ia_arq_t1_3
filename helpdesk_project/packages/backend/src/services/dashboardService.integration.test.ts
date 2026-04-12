import { getKpis, getQueueSummary, getTrends, getDashboardMetrics } from "./dashboardService";
import {
  closeTestDatabase,
  ensureDefaultOrganization,
  testDb,
  truncateTables,
  verifyTestDatabaseConnection,
} from "../data/testHelper";

async function createOrganization(name: string) {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  return testDb.one<{ id: number }>(
    "INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id",
    [name, slug],
  );
}

async function createUser(organizationId: number, name: string) {
  return testDb.one<{ id: number }>(
    `INSERT INTO users (name, email, password, organization_id)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [name, `${name.toLowerCase().replace(/\s+/g, ".")}@test.com`, "$2b$10$dummyhash000000000000000000000000000000000000000000000", organizationId],
  );
}

async function createTicketType(organizationId: number, name: string) {
  return testDb.one<{ id: number }>(
    "INSERT INTO ticket_types (name, organization_id) VALUES ($1, $2) RETURNING id",
    [name, organizationId],
  );
}

async function insertTicket(input: {
  organizationId: number;
  status?: string;
  assignedToId?: number | null;
  ticketTypeId?: number | null;
  createdAt?: string;
  updatedAt?: string;
  name?: string;
}) {
  const code = `TK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  return testDb.one<{ id: number; code: string }>(
    `INSERT INTO tickets (code, name, email, phone, description, status, assigned_to_id, ticket_type_id, organization_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id, code`,
    [
      code,
      input.name ?? "Test ticket",
      "test@test.com",
      "+5511999999999",
      "Test description",
      input.status ?? "new",
      input.assignedToId ?? null,
      input.ticketTypeId ?? null,
      input.organizationId,
      input.createdAt ?? "NOW()",
      input.updatedAt ?? "NOW()",
    ],
  );
}

async function insertTicketRaw(input: {
  organizationId: number;
  status?: string;
  assignedToId?: number | null;
  ticketTypeId?: number | null;
  createdAt?: string;
  updatedAt?: string;
  name?: string;
}) {
  const code = `TK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const createdAt = input.createdAt ?? new Date().toISOString();
  const updatedAt = input.updatedAt ?? createdAt;
  return testDb.one<{ id: number; code: string }>(
    `INSERT INTO tickets (code, name, email, phone, description, status, assigned_to_id, ticket_type_id, organization_id, created_at, updated_at)
     VALUES ($1, $2, 'test@test.com', '+5511999999999', 'Test', $3, $4, $5, $6, $7::timestamp, $8::timestamp)
     RETURNING id, code`,
    [
      code,
      input.name ?? "Test ticket",
      input.status ?? "new",
      input.assignedToId ?? null,
      input.ticketTypeId ?? null,
      input.organizationId,
      createdAt,
      updatedAt,
    ],
  );
}

describe("dashboardService integration", () => {
  beforeAll(async () => {
    await verifyTestDatabaseConnection();
  });

  beforeEach(async () => {
    await truncateTables();
  });

  afterAll(async () => {
    await truncateTables();
    await closeTestDatabase();
  });

  describe("full metrics query with seeded tickets", () => {
    it("returns correct KPI values", async () => {
      const org = await ensureDefaultOrganization();
      const agent = await createUser(org.id, "Agent One");
      const ticketType = await createTicketType(org.id, "Bug");

      await insertTicketRaw({ organizationId: org.id, status: "new", ticketTypeId: ticketType.id, createdAt: "2026-04-06T08:00:00Z" });
      await insertTicketRaw({ organizationId: org.id, status: "new", ticketTypeId: ticketType.id });
      await insertTicketRaw({ organizationId: org.id, status: "assigned", assignedToId: agent.id, ticketTypeId: ticketType.id });
      await insertTicketRaw({
        organizationId: org.id,
        status: "closed",
        assignedToId: agent.id,
        ticketTypeId: ticketType.id,
        createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const result = await getDashboardMetrics(org.id);

      expect(result.kpis.openTickets).toBe(3);
      expect(result.kpis.unassignedTickets).toBe(2);
      expect(result.kpis.closedToday).toBe(1);
      expect(result.kpis.newToday).toBeGreaterThanOrEqual(3);
      expect(result.kpis.oldestWaitingTicket).not.toBeNull();
      expect(result.kpis.oldestWaitingTicket?.code).toBeDefined();
      expect(result.kpis.avgResolutionTimeHours).not.toBeNull();
      expect(typeof result.kpis.avgResolutionTimeHours).toBe("number");
      expect(result.queue.length).toBeGreaterThanOrEqual(1);
      expect(result.refreshedAt).toBeDefined();
      expect(result.trends).toBeUndefined();
    });
  });

  describe("multi-tenancy isolation", () => {
    it("metrics for org A do not include org B tickets", async () => {
      const orgA = await ensureDefaultOrganization();
      const orgB = await createOrganization("Other Org");

      await insertTicketRaw({ organizationId: orgA.id, status: "new" });
      await insertTicketRaw({ organizationId: orgA.id, status: "new" });
      await insertTicketRaw({ organizationId: orgB.id, status: "new" });
      await insertTicketRaw({ organizationId: orgB.id, status: "new" });
      await insertTicketRaw({ organizationId: orgB.id, status: "new" });

      const metricsA = await getDashboardMetrics(orgA.id);
      const metricsB = await getDashboardMetrics(orgB.id);

      expect(metricsA.kpis.openTickets).toBe(2);
      expect(metricsB.kpis.openTickets).toBe(3);
      expect(metricsA.queue.length).toBe(2);
      expect(metricsB.queue.length).toBe(3);
    });
  });

  describe("trend data", () => {
    it("correctly groups by date over a 7-day range with seeded data", async () => {
      const org = await ensureDefaultOrganization();
      const agent = await createUser(org.id, "Agent Trend");
      const ticketType = await createTicketType(org.id, "Feature");

      const today = new Date();
      const daysAgo = (n: number) => {
        const d = new Date(today);
        d.setDate(d.getDate() - n);
        return d.toISOString();
      };

      await insertTicketRaw({ organizationId: org.id, status: "new", ticketTypeId: ticketType.id, createdAt: daysAgo(1) });
      await insertTicketRaw({ organizationId: org.id, status: "new", ticketTypeId: ticketType.id, createdAt: daysAgo(1) });
      await insertTicketRaw({ organizationId: org.id, status: "new", ticketTypeId: ticketType.id, createdAt: daysAgo(2) });
      await insertTicketRaw({
        organizationId: org.id,
        status: "closed",
        assignedToId: agent.id,
        ticketTypeId: ticketType.id,
        createdAt: daysAgo(3),
        updatedAt: daysAgo(1),
      });

      const result = await getDashboardMetrics(org.id, "7d");

      expect(result.trends).toBeDefined();
      expect(result.trends!.volume.length).toBeGreaterThanOrEqual(2);
      const totalVolume = result.trends!.volume.reduce((sum, v) => sum + v.count, 0);
      expect(totalVolume).toBe(4);
      expect(result.trends!.resolutionTime.length).toBeGreaterThanOrEqual(1);
      expect(result.trends!.byType.length).toBe(1);
      expect(result.trends!.byType[0].typeName).toBe("Feature");
      expect(result.trends!.byType[0].count).toBe(4);
    });
  });
});
