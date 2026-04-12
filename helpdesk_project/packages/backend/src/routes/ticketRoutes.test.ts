import jwt from "jsonwebtoken";
import request from "supertest";
import { generateText } from "ai";
import { app } from "../index";
import {
  closeTestDatabase,
  testDb,
  truncateTables,
  verifyTestDatabaseConnection,
} from "../data/testHelper";

jest.mock("ai", () => ({
  generateText: jest.fn(),
  Output: {
    object: jest.fn().mockReturnValue("mocked-object-output"),
    choice: jest.fn().mockReturnValue("mocked-choice-output"),
  },
}));

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

async function createTicketType(organizationId: number, name: string) {
  return testDb.one<{ id: number }>(
    "INSERT INTO ticket_types (name, organization_id) VALUES ($1, $2) RETURNING id",
    [name, organizationId],
  );
}

function signToken(payload: { userId: number; organizationId: number; admin: boolean }) {
  return jwt.sign(payload, JWT_SECRET);
}

describe("/api/tickets", () => {
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
    it("GET /api/tickets returns 401 without Authorization header", async () => {
      const response = await request(app).get("/api/tickets");
      expect(response.status).toBe(401);
    });

    it("GET /api/tickets returns 401 with invalid token", async () => {
      const response = await request(app)
        .get("/api/tickets")
        .set("Authorization", "Bearer invalid-token");
      expect(response.status).toBe(401);
    });

    it("GET /api/tickets/:id returns 401 without Authorization header", async () => {
      const response = await request(app).get("/api/tickets/1");
      expect(response.status).toBe(401);
    });

    it("POST /api/tickets/:id/assign returns 401 without Authorization header", async () => {
      const response = await request(app).post("/api/tickets/1/assign");
      expect(response.status).toBe(401);
    });

    it("POST /api/tickets/:id/forward returns 401 without Authorization header", async () => {
      const response = await request(app).post("/api/tickets/1/forward");
      expect(response.status).toBe(401);
    });

    it("POST /api/tickets/:id/close returns 401 without Authorization header", async () => {
      const response = await request(app).post("/api/tickets/1/close");
      expect(response.status).toBe(401);
    });

    it("POST /api/tickets/:id/comments returns 401 without Authorization header", async () => {
      const response = await request(app).post("/api/tickets/1/comments");
      expect(response.status).toBe(401);
    });

    it("POST /api/tickets/:id/classify-ticket-type returns 401 without Authorization header", async () => {
      const response = await request(app).post("/api/tickets/1/classify-ticket-type");
      expect(response.status).toBe(401);
    });

    it("POST /api/tickets/:id/classify-sentiment returns 401 without Authorization header", async () => {
      const response = await request(app).post("/api/tickets/1/classify-sentiment");
      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/tickets", () => {
    it("returns 200 with list of organization tickets", async () => {
      const org = await createOrganization("Acme Corp");
      await insertTicket(org.id, "TK-LIST0001");
      await insertTicket(org.id, "TK-LIST0002");
      const token = signToken({ userId: 1, organizationId: org.id, admin: false });

      const response = await request(app)
        .get("/api/tickets")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(response.body.data[0]).toHaveProperty("id");
      expect(response.body.data[0]).toHaveProperty("code");
      expect(response.body.data[0]).toHaveProperty("status");
      expect(response.body.data[0]).toHaveProperty("name");
      expect(response.body.data[0]).toHaveProperty("createdAt");
    });

    it("returns 200 with only tickets matching status filter", async () => {
      const org = await createOrganization("Acme Corp");
      const user = await createUser(org.id, "Operator", "op@test.com");
      await insertTicket(org.id, "TK-FLTR0001", { status: "new" });
      await insertTicket(org.id, "TK-FLTR0002", { status: "assigned", assignedToId: user.id });
      await insertTicket(org.id, "TK-FLTR0003", { status: "closed", assignedToId: user.id });
      const token = signToken({ userId: user.id, organizationId: org.id, admin: false });

      const response = await request(app)
        .get("/api/tickets?status=new")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.total).toBe(1);
      expect(response.body.data[0].code).toBe("TK-FLTR0001");
    });

    it("returns 200 with tickets matching multiple status filters", async () => {
      const org = await createOrganization("Acme Corp");
      const user = await createUser(org.id, "Operator", "op@test.com");
      await insertTicket(org.id, "TK-MULT0001", { status: "new" });
      await insertTicket(org.id, "TK-MULT0002", { status: "assigned", assignedToId: user.id });
      await insertTicket(org.id, "TK-MULT0003", { status: "closed", assignedToId: user.id });
      const token = signToken({ userId: user.id, organizationId: org.id, admin: false });

      const response = await request(app)
        .get("/api/tickets?status=new&status=assigned")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.total).toBe(2);
      const codes = response.body.data.map((t: { code: string }) => t.code);
      expect(codes).toContain("TK-MULT0001");
      expect(codes).toContain("TK-MULT0002");
    });

    it("returns empty array when no tickets exist", async () => {
      const org = await createOrganization("Acme Corp");
      const token = signToken({ userId: 1, organizationId: org.id, admin: false });

      const response = await request(app)
        .get("/api/tickets")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: [], total: 0 });
    });

    it("does not return tickets from other organizations", async () => {
      const org1 = await createOrganization("Acme Corp");
      const org2 = await createOrganization("Other Corp");
      await insertTicket(org1.id, "TK-ORG10001");
      await insertTicket(org2.id, "TK-ORG20001");
      const token = signToken({ userId: 1, organizationId: org1.id, admin: false });

      const response = await request(app)
        .get("/api/tickets")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].code).toBe("TK-ORG10001");
    });
  });

  describe("GET /api/tickets/:id", () => {
    it("returns 200 with full ticket detail including comments, attachments, assignments", async () => {
      const org = await createOrganization("Acme Corp");
      const user = await createUser(org.id, "Operator Jane", "jane@test.com");
      const ticketType = await createTicketType(org.id, "Support");
      const ticket = await insertTicket(org.id, "TK-DETL0001", {
        status: "assigned",
        assignedToId: user.id,
        ticketTypeId: ticketType.id,
      });

      await testDb.none(
        `INSERT INTO ticket_attachments (ticket_id, filename, content_type, content)
         VALUES ($1, $2, $3, $4)`,
        [ticket.id, "screenshot.png", "image/png", "aGVsbG8="],
      );

      await testDb.none(
        `INSERT INTO ticket_assignments (ticket_id, assigned_to_id, assigned_by_id)
         VALUES ($1, $2, $3)`,
        [ticket.id, user.id, user.id],
      );

      const comment = await testDb.one<{ id: number }>(
        `INSERT INTO ticket_comments (ticket_id, user_id, content)
         VALUES ($1, $2, $3) RETURNING id`,
        [ticket.id, user.id, "Looking into this now."],
      );

      await testDb.none(
        `INSERT INTO ticket_attachments (ticket_id, ticket_comment_id, filename, content_type, content)
         VALUES ($1, $2, $3, $4, $5)`,
        [ticket.id, comment.id, "response.pdf", "application/pdf", "cGRm"],
      );

      const token = signToken({ userId: user.id, organizationId: org.id, admin: false });

      const response = await request(app)
        .get(`/api/tickets/${ticket.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(ticket.id);
      expect(response.body.code).toBe("TK-DETL0001");
      expect(response.body.status).toBe("assigned");
      expect(response.body.ticketTypeName).toBe("Support");
      expect(response.body.assignedToName).toBe("Operator Jane");
      expect(response.body.comments).toHaveLength(1);
      expect(response.body.comments[0].content).toBe("Looking into this now.");
      expect(response.body.comments[0].attachments).toHaveLength(1);
      expect(response.body.attachments).toHaveLength(1);
      expect(response.body.attachments[0].filename).toBe("screenshot.png");
      expect(response.body.assignments).toHaveLength(1);
      expect(response.body.assignments[0].assignedToName).toBe("Operator Jane");
    });

    it("returns 404 for non-existent ticket", async () => {
      const org = await createOrganization("Acme Corp");
      const token = signToken({ userId: 1, organizationId: org.id, admin: false });

      const response = await request(app)
        .get("/api/tickets/999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Ticket not found");
    });

    it("returns 404 for ticket in different organization", async () => {
      const org1 = await createOrganization("Acme Corp");
      const org2 = await createOrganization("Other Corp");
      const ticket = await insertTicket(org1.id, "TK-OORG0001");
      const token = signToken({ userId: 1, organizationId: org2.id, admin: false });

      const response = await request(app)
        .get(`/api/tickets/${ticket.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Ticket not found");
    });
  });

  describe("POST /api/tickets/:id/assign", () => {
    it("returns 200 and assigns ticket to self", async () => {
      const org = await createOrganization("Acme Corp");
      const user = await createUser(org.id, "Operator", "op@test.com");
      const ticket = await insertTicket(org.id, "TK-ASGN0001", { status: "new" });
      const token = signToken({ userId: user.id, organizationId: org.id, admin: false });

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/assign`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Ticket assigned successfully");

      const updated = await testDb.one<{ status: string; assignedToId: number }>(
        `SELECT status, assigned_to_id AS "assignedToId" FROM tickets WHERE id = $1`,
        [ticket.id],
      );
      expect(updated.status).toBe("assigned");
      expect(updated.assignedToId).toBe(user.id);
    });

    it("returns 400 on already-assigned ticket", async () => {
      const org = await createOrganization("Acme Corp");
      const user = await createUser(org.id, "Operator", "op@test.com");
      const ticket = await insertTicket(org.id, "TK-ASGN0002", { status: "assigned", assignedToId: user.id });
      const token = signToken({ userId: user.id, organizationId: org.id, admin: false });

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/assign`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Only new tickets can be assigned");
    });

    it("returns 404 for non-existent ticket", async () => {
      const org = await createOrganization("Acme Corp");
      const token = signToken({ userId: 1, organizationId: org.id, admin: false });

      const response = await request(app)
        .post("/api/tickets/999/assign")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Ticket not found");
    });
  });

  describe("POST /api/tickets/:id/forward", () => {
    it("returns 200 with valid userId", async () => {
      const org = await createOrganization("Acme Corp");
      const user1 = await createUser(org.id, "Operator A", "a@test.com");
      const user2 = await createUser(org.id, "Operator B", "b@test.com");
      const ticket = await insertTicket(org.id, "TK-FWRD0001", { status: "assigned", assignedToId: user1.id });
      const token = signToken({ userId: user1.id, organizationId: org.id, admin: false });

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/forward`)
        .set("Authorization", `Bearer ${token}`)
        .send({ userId: user2.id });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Ticket forwarded successfully");

      const updated = await testDb.one<{ assignedToId: number }>(
        `SELECT assigned_to_id AS "assignedToId" FROM tickets WHERE id = $1`,
        [ticket.id],
      );
      expect(updated.assignedToId).toBe(user2.id);
    });

    it("returns 400 when forwarding to same user", async () => {
      const org = await createOrganization("Acme Corp");
      const user = await createUser(org.id, "Operator", "op@test.com");
      const ticket = await insertTicket(org.id, "TK-FWRD0002", { status: "assigned", assignedToId: user.id });
      const token = signToken({ userId: user.id, organizationId: org.id, admin: false });

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/forward`)
        .set("Authorization", `Bearer ${token}`)
        .send({ userId: user.id });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Cannot forward ticket to the same user currently assigned");
    });

    it("returns 400 when forwarding to user in different organization", async () => {
      const org1 = await createOrganization("Acme Corp");
      const org2 = await createOrganization("Other Corp");
      const user1 = await createUser(org1.id, "Operator A", "a@test.com");
      const user2 = await createUser(org2.id, "Operator B", "b@test.com");
      const ticket = await insertTicket(org1.id, "TK-FWRD0003", { status: "assigned", assignedToId: user1.id });
      const token = signToken({ userId: user1.id, organizationId: org1.id, admin: false });

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/forward`)
        .set("Authorization", `Bearer ${token}`)
        .send({ userId: user2.id });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Target user not found in the same organization");
    });

    it("returns 400 when userId is missing", async () => {
      const org = await createOrganization("Acme Corp");
      const user = await createUser(org.id, "Operator", "op@test.com");
      const ticket = await insertTicket(org.id, "TK-FWRD0004", { status: "assigned", assignedToId: user.id });
      const token = signToken({ userId: user.id, organizationId: org.id, admin: false });

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/forward`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Valid userId is required");
    });

    it("returns 404 for non-existent ticket", async () => {
      const org = await createOrganization("Acme Corp");
      const token = signToken({ userId: 1, organizationId: org.id, admin: false });

      const response = await request(app)
        .post("/api/tickets/999/forward")
        .set("Authorization", `Bearer ${token}`)
        .send({ userId: 2 });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Ticket not found");
    });
  });

  describe("POST /api/tickets/:id/close", () => {
    it("returns 200 and changes status to closed", async () => {
      const org = await createOrganization("Acme Corp");
      const user = await createUser(org.id, "Operator", "op@test.com");
      const ticket = await insertTicket(org.id, "TK-CLOS0001", { status: "assigned", assignedToId: user.id });
      const token = signToken({ userId: user.id, organizationId: org.id, admin: false });

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/close`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Ticket closed successfully");

      const updated = await testDb.one<{ status: string }>(
        "SELECT status FROM tickets WHERE id = $1",
        [ticket.id],
      );
      expect(updated.status).toBe("closed");
    });

    it("returns 400 on non-assigned ticket", async () => {
      const org = await createOrganization("Acme Corp");
      const ticket = await insertTicket(org.id, "TK-CLOS0002", { status: "new" });
      const token = signToken({ userId: 1, organizationId: org.id, admin: false });

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/close`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Only assigned tickets can be closed");
    });

    it("returns 404 for non-existent ticket", async () => {
      const org = await createOrganization("Acme Corp");
      const token = signToken({ userId: 1, organizationId: org.id, admin: false });

      const response = await request(app)
        .post("/api/tickets/999/close")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Ticket not found");
    });
  });

  describe("POST /api/tickets/:id/comments", () => {
    it("returns 201 with comment data", async () => {
      const org = await createOrganization("Acme Corp");
      const user = await createUser(org.id, "Operator", "op@test.com");
      const ticket = await insertTicket(org.id, "TK-CMNT0001");
      const token = signToken({ userId: user.id, organizationId: org.id, admin: false });

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/comments`)
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "This is a comment" });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(typeof response.body.id).toBe("number");
    });

    it("returns 201 with attachments", async () => {
      const org = await createOrganization("Acme Corp");
      const user = await createUser(org.id, "Operator", "op@test.com");
      const ticket = await insertTicket(org.id, "TK-CMNT0002");
      const token = signToken({ userId: user.id, organizationId: org.id, admin: false });

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/comments`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          content: "See attached file",
          attachments: [
            {
              filename: "solution.pdf",
              contentType: "application/pdf",
              content: "cGRm",
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");

      const attachments = await testDb.manyOrNone(
        "SELECT * FROM ticket_attachments WHERE ticket_comment_id = $1",
        [response.body.id],
      );
      expect(attachments).toHaveLength(1);
      expect(attachments[0].filename).toBe("solution.pdf");
    });

    it("returns 400 when content is missing", async () => {
      const org = await createOrganization("Acme Corp");
      const user = await createUser(org.id, "Operator", "op@test.com");
      const ticket = await insertTicket(org.id, "TK-CMNT0003");
      const token = signToken({ userId: user.id, organizationId: org.id, admin: false });

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/comments`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Content is required");
    });

    it("returns 404 for non-existent ticket", async () => {
      const org = await createOrganization("Acme Corp");
      const user = await createUser(org.id, "Operator", "op@test.com");
      const token = signToken({ userId: user.id, organizationId: org.id, admin: false });

      const response = await request(app)
        .post("/api/tickets/999/comments")
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "Comment on missing ticket" });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Ticket not found");
    });
  });

  describe("POST /api/tickets/:id/classify-ticket-type", () => {
    const originalOpenAiKey = process.env.OPENAI_API_KEY;

    afterEach(() => {
      process.env.OPENAI_API_KEY = originalOpenAiKey;
      (generateText as jest.Mock).mockReset();
    });

    it("returns 503 when OPENAI_API_KEY is not set", async () => {
      delete process.env.OPENAI_API_KEY;
      const org = await createOrganization("Acme Corp");
      const user = await createUser(org.id, "Operator", "op@test.com");
      await createTicketType(org.id, "Bug");
      const ticket = await insertTicket(org.id, "TK-CLS0001");
      const token = signToken({ userId: user.id, organizationId: org.id, admin: false });

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/classify-ticket-type`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(503);
      expect(response.body.error).toBe("OpenAI API key is not configured");
    });

    it("returns 400 when organization has no ticket types", async () => {
      process.env.OPENAI_API_KEY = "test-openai-key";
      const org = await createOrganization("Acme Corp");
      const user = await createUser(org.id, "Operator", "op@test.com");
      const ticket = await insertTicket(org.id, "TK-CLS0002");
      const token = signToken({ userId: user.id, organizationId: org.id, admin: false });

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/classify-ticket-type`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("No ticket types defined for this organization");
    });

    it("returns 200, persists ticket type, and returns names", async () => {
      process.env.OPENAI_API_KEY = "test-openai-key";
      const org = await createOrganization("Acme Corp");
      const user = await createUser(org.id, "Operator", "op@test.com");
      const tt = await createTicketType(org.id, "Incident");
      const ticket = await insertTicket(org.id, "TK-CLS0003", {
        description: "Production is down",
      });
      (generateText as jest.Mock).mockResolvedValue({
        output: { ticket_type_id: tt.id },
      });
      const token = signToken({ userId: user.id, organizationId: org.id, admin: false });

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/classify-ticket-type`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ticketTypeId: tt.id,
        ticketTypeName: "Incident",
      });

      const row = await testDb.one<{ ticket_type_id: number | null }>(
        "SELECT ticket_type_id FROM tickets WHERE id = $1",
        [ticket.id],
      );
      expect(row.ticket_type_id).toBe(tt.id);
      expect(generateText).toHaveBeenCalled();
    });

    it("returns 502 when AI SDK throws an error", async () => {
      process.env.OPENAI_API_KEY = "test-openai-key";
      const org = await createOrganization("Acme Corp");
      const user = await createUser(org.id, "Operator", "op@test.com");
      await createTicketType(org.id, "Bug");
      const ticket = await insertTicket(org.id, "TK-CLS0004");
      (generateText as jest.Mock).mockRejectedValue(new Error("Rate limit"));
      const token = signToken({ userId: user.id, organizationId: org.id, admin: false });

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/classify-ticket-type`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(502);
      expect(response.body.error).toBe("Classification request failed");
    });

    it("returns 404 for a ticket in another organization", async () => {
      process.env.OPENAI_API_KEY = "test-openai-key";
      const orgA = await createOrganization("Org A");
      const orgB = await createOrganization("Org B");
      const userA = await createUser(orgA.id, "Op A", "a@test.com");
      await createUser(orgB.id, "Op B", "b@test.com");
      await createTicketType(orgB.id, "Other");
      const ticketB = await insertTicket(orgB.id, "TK-CLS0005");
      const token = signToken({ userId: userA.id, organizationId: orgA.id, admin: false });

      const response = await request(app)
        .post(`/api/tickets/${ticketB.id}/classify-ticket-type`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Ticket not found");
    });
  });

  describe("POST /api/tickets/:id/classify-sentiment", () => {
    const originalOpenAiKey = process.env.OPENAI_API_KEY;

    afterEach(() => {
      process.env.OPENAI_API_KEY = originalOpenAiKey;
      (generateText as jest.Mock).mockReset();
    });

    it("returns 503 when OPENAI_API_KEY is not set", async () => {
      delete process.env.OPENAI_API_KEY;
      const org = await createOrganization("Acme Corp");
      const user = await createUser(org.id, "Operator", "op@test.com");
      const ticket = await insertTicket(org.id, "TK-SEN0001");
      const token = signToken({ userId: user.id, organizationId: org.id, admin: false });

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/classify-sentiment`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(503);
      expect(response.body.error).toBe("OpenAI API key is not configured");
    });

    it("returns 200, persists sentiment, and returns value", async () => {
      process.env.OPENAI_API_KEY = "test-openai-key";
      const org = await createOrganization("Acme Corp");
      const user = await createUser(org.id, "Operator", "op@test.com");
      const ticket = await insertTicket(org.id, "TK-SEN0002", {
        description: "Thanks for the quick help!",
      });
      (generateText as jest.Mock).mockResolvedValue({
        output: "positive",
      });
      const token = signToken({ userId: user.id, organizationId: org.id, admin: false });

      const response = await request(app)
        .post(`/api/tickets/${ticket.id}/classify-sentiment`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ sentiment: "positive" });

      const row = await testDb.one<{ sentiment: string | null }>(
        "SELECT sentiment FROM tickets WHERE id = $1",
        [ticket.id],
      );
      expect(row.sentiment).toBe("positive");
    });

    it("returns 404 for a ticket in another organization", async () => {
      process.env.OPENAI_API_KEY = "test-openai-key";
      const orgA = await createOrganization("Org A Sen");
      const orgB = await createOrganization("Org B Sen");
      const userA = await createUser(orgA.id, "Op A", "a2@test.com");
      await createUser(orgB.id, "Op B", "b2@test.com");
      const ticketB = await insertTicket(orgB.id, "TK-SEN0003");
      const token = signToken({ userId: userA.id, organizationId: orgA.id, admin: false });

      const response = await request(app)
        .post(`/api/tickets/${ticketB.id}/classify-sentiment`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Ticket not found");
    });
  });
});
