import jwt from "jsonwebtoken";
import request from "supertest";
import { app } from "../index";
import {
  closeTestDatabase,
  testDb,
  truncateTables,
  verifyTestDatabaseConnection,
} from "../data/testHelper";

const JWT_SECRET = "test-secret";

async function createOrganization(name: string) {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  return testDb.one<{ id: number; name: string }>(
    "INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id, name",
    [name, slug],
  );
}

async function createUser(organizationId: number, name: string, email: string) {
  return testDb.one<{ id: number; name: string }>(
    "INSERT INTO users (name, email, password, organization_id) VALUES ($1, $2, $3, $4) RETURNING id, name",
    [name, email, "$2b$10$dummyhashfortest000000000000000000000000000000", organizationId],
  );
}

async function createTicketType(organizationId: number, name: string) {
  return testDb.one<{ id: number }>(
    "INSERT INTO ticket_types (name, organization_id) VALUES ($1, $2) RETURNING id",
    [name, organizationId],
  );
}

async function insertTicket(
  organizationId: number,
  code: string,
  overrides: Record<string, unknown> = {},
) {
  const defaults = {
    name: "Test User",
    email: "test@example.com",
    phone: "+5511999999999",
    description: "Test description",
    status: "new",
    ticketTypeId: null,
    assignedToId: null,
  };
  const data = { ...defaults, ...overrides };
  return testDb.one<{ id: number; code: string }>(
    `INSERT INTO tickets (code, name, email, phone, description, status, ticket_type_id, assigned_to_id, organization_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, code`,
    [code, data.name, data.email, data.phone, data.description, data.status, data.ticketTypeId, data.assignedToId, organizationId],
  );
}

function signToken(payload: { userId: number; organizationId: number; admin: boolean }) {
  return jwt.sign(payload, JWT_SECRET);
}

describe("/api/dashboard", () => {
  const originalJwtSecret = process.env.JWT_SECRET;

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    await verifyTestDatabaseConnection();
  });

  beforeEach(async () => {
    await truncateTables();
  });

  afterAll(async () => {
    process.env.JWT_SECRET = originalJwtSecret;
    await truncateTables();
    await closeTestDatabase();
  });

  describe("Authentication", () => {
    it("GET /api/dashboard/metrics returns 401 without Authorization header", async () => {
      const response = await request(app).get("/api/dashboard/metrics");
      expect(response.status).toBe(401);
    });

    it("GET /api/dashboard/metrics returns 401 with invalid token", async () => {
      const response = await request(app)
        .get("/api/dashboard/metrics")
        .set("Authorization", "Bearer invalid-token");
      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/dashboard/metrics", () => {
    it("returns 200 with correct DashboardMetrics structure", async () => {
      const org = await createOrganization("Acme Corp");
      const user = await createUser(org.id, "Operator", "op@test.com");
      await insertTicket(org.id, "TK-DASH0001", { status: "new" });
      await insertTicket(org.id, "TK-DASH0002", { status: "assigned", assignedToId: user.id });
      const token = signToken({ userId: user.id, organizationId: org.id, admin: false });

      const response = await request(app)
        .get("/api/dashboard/metrics")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("kpis");
      expect(response.body).toHaveProperty("queue");
      expect(response.body).toHaveProperty("refreshedAt");
      expect(response.body).not.toHaveProperty("trends");
      expect(response.body.kpis).toHaveProperty("openTickets");
      expect(response.body.kpis).toHaveProperty("unassignedTickets");
      expect(response.body.kpis).toHaveProperty("closedToday");
      expect(response.body.kpis).toHaveProperty("newToday");
      expect(response.body.kpis).toHaveProperty("oldestWaitingTicket");
      expect(response.body.kpis).toHaveProperty("avgResolutionTimeHours");
      expect(response.body.kpis.openTickets).toBe(2);
    });

    it("returns 200 with trends when period=7d", async () => {
      const org = await createOrganization("Acme Corp");
      const user = await createUser(org.id, "Operator", "op@test.com");
      await insertTicket(org.id, "TK-TRND0001", { status: "new" });
      const token = signToken({ userId: user.id, organizationId: org.id, admin: false });

      const response = await request(app)
        .get("/api/dashboard/metrics?period=7d")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("trends");
      expect(response.body.trends).toHaveProperty("volume");
      expect(response.body.trends).toHaveProperty("resolutionTime");
      expect(response.body.trends).toHaveProperty("byType");
    });

    it("returns 200 with trends when period=30d", async () => {
      const org = await createOrganization("Acme Corp");
      const token = signToken({ userId: 1, organizationId: org.id, admin: false });

      const response = await request(app)
        .get("/api/dashboard/metrics?period=30d")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("trends");
    });

    it("returns 200 with trends when period=90d", async () => {
      const org = await createOrganization("Acme Corp");
      const token = signToken({ userId: 1, organizationId: org.id, admin: false });

      const response = await request(app)
        .get("/api/dashboard/metrics?period=90d")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("trends");
    });

    it("returns 400 for invalid period value", async () => {
      const org = await createOrganization("Acme Corp");
      const token = signToken({ userId: 1, organizationId: org.id, admin: false });

      const response = await request(app)
        .get("/api/dashboard/metrics?period=invalid")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Invalid period");
    });

    it("returns data scoped to the authenticated user's organization", async () => {
      const org1 = await createOrganization("Acme Corp");
      const org2 = await createOrganization("Other Corp");
      const user1 = await createUser(org1.id, "Operator A", "a@test.com");
      await insertTicket(org1.id, "TK-SCOP0001", { status: "new" });
      await insertTicket(org1.id, "TK-SCOP0002", { status: "new" });
      await insertTicket(org2.id, "TK-SCOP0003", { status: "new" });
      await insertTicket(org2.id, "TK-SCOP0004", { status: "new" });
      await insertTicket(org2.id, "TK-SCOP0005", { status: "new" });
      const token = signToken({ userId: user1.id, organizationId: org1.id, admin: false });

      const response = await request(app)
        .get("/api/dashboard/metrics")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.kpis.openTickets).toBe(2);
      expect(response.body.queue).toHaveLength(2);
      const queueCodes = response.body.queue.map((item: { code: string }) => item.code);
      expect(queueCodes).toContain("TK-SCOP0001");
      expect(queueCodes).toContain("TK-SCOP0002");
      expect(queueCodes).not.toContain("TK-SCOP0003");
    });
  });
});
