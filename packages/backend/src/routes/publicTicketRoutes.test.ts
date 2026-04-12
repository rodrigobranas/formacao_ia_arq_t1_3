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

async function createOrganization(name: string, slug?: string) {
  const orgSlug = slug ?? name.toLowerCase().replace(/\s+/g, "-");
  return testDb.one<{ id: number; name: string; slug: string }>(
    "INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id, name, slug",
    [name, orgSlug],
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
  };
  const data = { ...defaults, ...overrides };
  return testDb.one<{ id: number; code: string }>(
    `INSERT INTO tickets (code, name, email, phone, description, organization_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, code`,
    [code, data.name, data.email, data.phone, data.description, organizationId],
  );
}

describe("/api/public/:orgSlug/tickets", () => {
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

  describe("POST /api/public/:orgSlug/tickets", () => {
    const originalOpenAiKey = process.env.OPENAI_API_KEY;

    beforeEach(() => {
      process.env.OPENAI_API_KEY = "test-openai-key";
      (generateText as jest.Mock).mockResolvedValue({
        output: { valid_for_support_ticket: true, rejection_reason: "" },
      });
    });

    afterEach(() => {
      process.env.OPENAI_API_KEY = originalOpenAiKey;
      (generateText as jest.Mock).mockReset();
    });

    it("returns 201 with ticket code when valid data is provided", async () => {
      const org = await createOrganization("Acme Corp", "acme-corp");

      const response = await request(app)
        .post(`/api/public/${org.slug}/tickets`)
        .send({
          name: "John Doe",
          email: "john@example.com",
          phone: "+5511999999999",
          description: "I need help with my account",
        });

      expect(response.status).toBe(201);
      expect(response.body.code).toMatch(/^TK-[A-Z0-9]{8}$/);
      expect(response.body.message).toBe("Ticket created successfully");
    });

    it("returns 201 with optional ticketTypeId and attachments", async () => {
      const org = await createOrganization("Acme Corp", "acme-corp");
      const ticketType = await createTicketType(org.id, "Support");

      const response = await request(app)
        .post(`/api/public/${org.slug}/tickets`)
        .send({
          name: "Jane Doe",
          email: "jane@example.com",
          phone: "+5511888888888",
          description: "Issue with billing",
          ticketTypeId: ticketType.id,
          attachments: [
            {
              filename: "screenshot.png",
              contentType: "image/png",
              content: "aGVsbG8gd29ybGQ=",
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.code).toMatch(/^TK-[A-Z0-9]{8}$/);
      expect(response.body.message).toBe("Ticket created successfully");
    });

    it("returns 400 when image validation rejects an attachment", async () => {
      const org = await createOrganization("Acme Corp", "acme-corp");
      (generateText as jest.Mock).mockResolvedValue({
        output: {
          valid_for_support_ticket: false,
          rejection_reason: "Image appears unrelated to the support request.",
        },
      });

      const response = await request(app)
        .post(`/api/public/${org.slug}/tickets`)
        .send({
          name: "Jane Doe",
          email: "jane@example.com",
          phone: "+5511888888888",
          description: "Issue with billing",
          attachments: [
            {
              filename: "screenshot.png",
              contentType: "image/png",
              content: "aGVsbG8gd29ybGQ=",
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("screenshot.png");
      expect(response.body.error).toContain("unrelated");
    });

    it("returns 503 when OPENAI_API_KEY is not set and an image attachment is sent", async () => {
      delete process.env.OPENAI_API_KEY;
      const org = await createOrganization("Acme Corp", "acme-corp");

      const response = await request(app)
        .post(`/api/public/${org.slug}/tickets`)
        .send({
          name: "Jane Doe",
          email: "jane@example.com",
          phone: "+5511888888888",
          description: "Screenshot attached",
          attachments: [
            {
              filename: "screenshot.png",
              contentType: "image/png",
              content: "aGVsbG8gd29ybGQ=",
            },
          ],
        });

      expect(response.status).toBe(503);
      expect(response.body.error).toBe("OpenAI API key is not configured");
    });

    it("returns 502 when AI SDK throws an error for image validation", async () => {
      const org = await createOrganization("Acme Corp", "acme-corp");
      (generateText as jest.Mock).mockRejectedValue(new Error("Rate limit"));

      const response = await request(app)
        .post(`/api/public/${org.slug}/tickets`)
        .send({
          name: "Jane Doe",
          email: "jane@example.com",
          phone: "+5511888888888",
          description: "Screenshot attached",
          attachments: [
            {
              filename: "screenshot.png",
              contentType: "image/png",
              content: "aGVsbG8gd29ybGQ=",
            },
          ],
        });

      expect(response.status).toBe(502);
      expect(response.body.error).toBe("Classification request failed");
    });

    it("returns 201 with classified ticket type and sentiment", async () => {
      const org = await createOrganization("Acme Corp", "acme-corp");
      const ticketType = await createTicketType(org.id, "Bug");

      (generateText as jest.Mock)
        .mockResolvedValueOnce({ output: { ticket_type_id: ticketType.id } })
        .mockResolvedValueOnce({ output: "negative" });

      const response = await request(app)
        .post(`/api/public/${org.slug}/tickets`)
        .send({
          name: "John Doe",
          email: "john@example.com",
          phone: "+5511999999999",
          description: "My app keeps crashing when I try to login",
        });

      expect(response.status).toBe(201);

      const ticket = await testDb.one<{ ticketTypeId: number | null; sentiment: string | null }>(
        `SELECT ticket_type_id AS "ticketTypeId", sentiment FROM tickets WHERE code = $1`,
        [response.body.code],
      );
      expect(ticket.ticketTypeId).toBe(ticketType.id);
      expect(ticket.sentiment).toBe("negative");
    });

    it("returns 400 when name is missing", async () => {
      const org = await createOrganization("Acme Corp", "acme-corp");

      const response = await request(app)
        .post(`/api/public/${org.slug}/tickets`)
        .send({
          email: "john@example.com",
          phone: "+5511999999999",
          description: "Some issue",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Name is required");
    });

    it("returns 400 when email is missing", async () => {
      const org = await createOrganization("Acme Corp", "acme-corp");

      const response = await request(app)
        .post(`/api/public/${org.slug}/tickets`)
        .send({
          name: "John Doe",
          phone: "+5511999999999",
          description: "Some issue",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Email is required");
    });

    it("returns 400 when phone is missing", async () => {
      const org = await createOrganization("Acme Corp", "acme-corp");

      const response = await request(app)
        .post(`/api/public/${org.slug}/tickets`)
        .send({
          name: "John Doe",
          email: "john@example.com",
          description: "Some issue",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Phone is required");
    });

    it("returns 400 when description is missing", async () => {
      const org = await createOrganization("Acme Corp", "acme-corp");

      const response = await request(app)
        .post(`/api/public/${org.slug}/tickets`)
        .send({
          name: "John Doe",
          email: "john@example.com",
          phone: "+5511999999999",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Description is required");
    });

    it("returns 404 when org slug is invalid", async () => {
      const response = await request(app)
        .post("/api/public/nonexistent-org/tickets")
        .send({
          name: "John Doe",
          email: "john@example.com",
          phone: "+5511999999999",
          description: "Some issue",
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Organization not found");
    });

    it("returns 400 when attachment exceeds maximum size", async () => {
      const org = await createOrganization("Acme Corp", "acme-corp");
      const oversizedContent = "A".repeat(1_400_000);

      const response = await request(app)
        .post(`/api/public/${org.slug}/tickets`)
        .send({
          name: "John Doe",
          email: "john@example.com",
          phone: "+5511999999999",
          description: "Issue with large file",
          attachments: [
            {
              filename: "large-file.bin",
              contentType: "application/octet-stream",
              content: oversizedContent,
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Attachment exceeds maximum size of 1MB");
    });

    it("does not require authentication", async () => {
      const org = await createOrganization("Acme Corp", "acme-corp");

      const response = await request(app)
        .post(`/api/public/${org.slug}/tickets`)
        .send({
          name: "John Doe",
          email: "john@example.com",
          phone: "+5511999999999",
          description: "No auth needed",
        });

      expect(response.status).toBe(201);
    });
  });

  describe("GET /api/public/:orgSlug/tickets/:code", () => {
    it("returns 200 with status info for a valid ticket code", async () => {
      const org = await createOrganization("Acme Corp", "acme-corp");
      const ticket = await insertTicket(org.id, "TK-ABCD1234");

      const response = await request(app)
        .get(`/api/public/${org.slug}/tickets/${ticket.code}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        code: "TK-ABCD1234",
        status: "new",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("returns 404 when ticket code does not exist", async () => {
      const org = await createOrganization("Acme Corp", "acme-corp");

      const response = await request(app)
        .get(`/api/public/${org.slug}/tickets/TK-NOTFOUND`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Ticket not found");
    });

    it("returns 404 when org slug does not match ticket organization", async () => {
      const org1 = await createOrganization("Acme Corp", "acme-corp");
      const org2 = await createOrganization("Other Corp", "other-corp");
      await insertTicket(org1.id, "TK-ORG1ONLY");

      const response = await request(app)
        .get(`/api/public/${org2.slug}/tickets/TK-ORG1ONLY`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Ticket not found");
    });

    it("returns 404 when org slug is invalid", async () => {
      const response = await request(app)
        .get("/api/public/nonexistent-org/tickets/TK-ABCD1234");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Organization not found");
    });

    it("does not require authentication", async () => {
      const org = await createOrganization("Acme Corp", "acme-corp");
      await insertTicket(org.id, "TK-NOAUTH01");

      const response = await request(app)
        .get(`/api/public/${org.slug}/tickets/TK-NOAUTH01`);

      expect(response.status).toBe(200);
    });
  });
});
