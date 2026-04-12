import { generateText } from "ai";
import {
  addComment,
  assignTicket,
  closeTicket,
  createTicket,
  forwardTicket,
  getTicketByCode,
  getTicketById,
  listTickets,
} from "./ticketService";
import { ValidationError, NotFoundError } from "./ticketTypeService";
import {
  closeTestDatabase,
  ensureDefaultOrganization,
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

async function createOrganization(name: string) {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  return testDb.one<{ id: number; name: string }>(
    "INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id, name",
    [name, slug],
  );
}

async function createUser(organizationId: number, name: string, email: string) {
  return testDb.one<{ id: number; name: string }>(
    `INSERT INTO users (name, email, password, organization_id)
     VALUES ($1, $2, $3, $4) RETURNING id, name`,
    [name, email, "$2b$10$dummyhashfortest000000000000000000000000000000000000", organizationId],
  );
}

async function createTicketType(organizationId: number, name: string) {
  return testDb.one<{ id: number }>(
    "INSERT INTO ticket_types (name, organization_id) VALUES ($1, $2) RETURNING id",
    [name, organizationId],
  );
}

const validInput = {
  name: "John Doe",
  email: "john@example.com",
  phone: "+5511999999999",
  description: "I need help with my order",
};

describe("ticketService", () => {
  const originalOpenAiKey = process.env.OPENAI_API_KEY;

  beforeAll(async () => {
    await verifyTestDatabaseConnection();
  });

  beforeEach(async () => {
    await truncateTables();
    process.env.OPENAI_API_KEY = "test-openai-key";
    (generateText as jest.Mock).mockResolvedValue({
      output: { valid_for_support_ticket: true, rejection_reason: "" },
    });
  });

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalOpenAiKey;
    (generateText as jest.Mock).mockReset();
  });

  afterAll(async () => {
    await truncateTables();
    await closeTestDatabase();
  });

  describe("createTicket", () => {
    it("creates a ticket with valid input and returns code with status new", async () => {
      const org = await ensureDefaultOrganization();
      const result = await createTicket(validInput, org.id);

      expect(result.code).toMatch(/^TK-[A-Z0-9]{8}$/);

      const ticket = await testDb.one(
        `SELECT status FROM tickets WHERE code = $1`,
        [result.code],
      );
      expect(ticket.status).toBe("new");
    });

    it("throws ValidationError when name is missing", async () => {
      const org = await ensureDefaultOrganization();
      await expect(
        createTicket({ ...validInput, name: "" }, org.id),
      ).rejects.toThrow(new ValidationError("Name is required"));
    });

    it("throws ValidationError when email is missing", async () => {
      const org = await ensureDefaultOrganization();
      await expect(
        createTicket({ ...validInput, email: "" }, org.id),
      ).rejects.toThrow(new ValidationError("Email is required"));
    });

    it("throws ValidationError when phone is missing", async () => {
      const org = await ensureDefaultOrganization();
      await expect(
        createTicket({ ...validInput, phone: "" }, org.id),
      ).rejects.toThrow(new ValidationError("Phone is required"));
    });

    it("throws ValidationError when description is missing", async () => {
      const org = await ensureDefaultOrganization();
      await expect(
        createTicket({ ...validInput, description: "" }, org.id),
      ).rejects.toThrow(new ValidationError("Description is required"));
    });

    it("throws ValidationError when attachment exceeds maximum size", async () => {
      const org = await ensureDefaultOrganization();
      const oversizedContent = "A".repeat(1_400_000);
      await expect(
        createTicket({
          ...validInput,
          attachments: [{ filename: "big.png", contentType: "image/png", content: oversizedContent }],
        }, org.id),
      ).rejects.toThrow(new ValidationError("Attachment exceeds maximum size of 1MB"));
    });

    it("stores ticketTypeId correctly when provided", async () => {
      const org = await ensureDefaultOrganization();
      const ticketType = await createTicketType(org.id, "Bug");
      const result = await createTicket(
        { ...validInput, ticketTypeId: ticketType.id },
        org.id,
      );

      const ticket = await testDb.one<{ ticketTypeId: number }>(
        `SELECT ticket_type_id AS "ticketTypeId" FROM tickets WHERE code = $1`,
        [result.code],
      );
      expect(ticket.ticketTypeId).toBe(ticketType.id);
    });

    it("throws NotFoundError when ticketTypeId is invalid", async () => {
      const org = await ensureDefaultOrganization();
      await expect(
        createTicket({ ...validInput, ticketTypeId: 9999 }, org.id),
      ).rejects.toThrow(new NotFoundError("Ticket type not found"));
    });

    it("creates attachments when provided", async () => {
      const org = await ensureDefaultOrganization();
      const result = await createTicket({
        ...validInput,
        attachments: [
          { filename: "doc.pdf", contentType: "application/pdf", content: "base64content" },
        ],
      }, org.id);

      const ticket = await testDb.one<{ id: number }>(
        "SELECT id FROM tickets WHERE code = $1",
        [result.code],
      );
      const attachments = await testDb.manyOrNone(
        "SELECT * FROM ticket_attachments WHERE ticket_id = $1 AND ticket_comment_id IS NULL",
        [ticket.id],
      );
      expect(attachments).toHaveLength(1);
      expect(attachments[0].filename).toBe("doc.pdf");
    });

    it("classifies ticket type and sentiment when no ticketTypeId is provided", async () => {
      const org = await ensureDefaultOrganization();
      const ticketType = await createTicketType(org.id, "Bug");

      (generateText as jest.Mock)
        .mockResolvedValueOnce({ output: { ticket_type_id: ticketType.id } })
        .mockResolvedValueOnce({ output: "negative" });

      const result = await createTicket(validInput, org.id);

      const ticket = await testDb.one<{ ticketTypeId: number | null; sentiment: string | null }>(
        `SELECT ticket_type_id AS "ticketTypeId", sentiment FROM tickets WHERE code = $1`,
        [result.code],
      );
      expect(ticket.ticketTypeId).toBe(ticketType.id);
      expect(ticket.sentiment).toBe("negative");
    });

    it("skips type classification when ticketTypeId is provided but classifies sentiment", async () => {
      const org = await ensureDefaultOrganization();
      const ticketType = await createTicketType(org.id, "Bug");

      (generateText as jest.Mock)
        .mockResolvedValueOnce({ output: "positive" });

      const result = await createTicket(
        { ...validInput, ticketTypeId: ticketType.id },
        org.id,
      );

      const ticket = await testDb.one<{ ticketTypeId: number | null; sentiment: string | null }>(
        `SELECT ticket_type_id AS "ticketTypeId", sentiment FROM tickets WHERE code = $1`,
        [result.code],
      );
      expect(ticket.ticketTypeId).toBe(ticketType.id);
      expect(ticket.sentiment).toBe("positive");
    });

    it("creates ticket with null values when classification fails", async () => {
      const org = await ensureDefaultOrganization();
      await createTicketType(org.id, "Bug");

      (generateText as jest.Mock).mockRejectedValue(new Error("API error"));

      const result = await createTicket(validInput, org.id);

      expect(result.code).toMatch(/^TK-[A-Z0-9]{8}$/);

      const ticket = await testDb.one<{ ticketTypeId: number | null; sentiment: string | null }>(
        `SELECT ticket_type_id AS "ticketTypeId", sentiment FROM tickets WHERE code = $1`,
        [result.code],
      );
      expect(ticket.ticketTypeId).toBeNull();
      expect(ticket.sentiment).toBeNull();
    });
  });

  describe("listTickets", () => {
    it("returns only tickets for the given organizationId", async () => {
      const org1 = await ensureDefaultOrganization();
      const org2 = await createOrganization("Other Org");

      await createTicket(validInput, org1.id);
      await createTicket({ ...validInput, name: "Jane Doe" }, org2.id);

      const result = await listTickets(org1.id);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].name).toBe("John Doe");
    });

    it("filters by status when provided", async () => {
      const org = await ensureDefaultOrganization();
      const user = await createUser(org.id, "Operator", "op@test.com");

      await createTicket(validInput, org.id);
      const result2 = await createTicket({ ...validInput, name: "Jane" }, org.id);

      const ticket2 = await testDb.one<{ id: number }>(
        "SELECT id FROM tickets WHERE code = $1",
        [result2.code],
      );
      await assignTicket(ticket2.id, user.id, org.id);

      const newTickets = await listTickets(org.id, ["new"]);
      expect(newTickets.data).toHaveLength(1);
      expect(newTickets.data[0].name).toBe("John Doe");

      const assignedTickets = await listTickets(org.id, ["assigned"]);
      expect(assignedTickets.data).toHaveLength(1);
      expect(assignedTickets.data[0].name).toBe("Jane");
    });
  });

  describe("getTicketById", () => {
    it("returns ticket with comments, attachments, and assignments", async () => {
      const org = await ensureDefaultOrganization();
      const user = await createUser(org.id, "Operator", "op@test.com");

      const result = await createTicket({
        ...validInput,
        attachments: [{ filename: "file.png", contentType: "image/png", content: "abc" }],
      }, org.id);

      const ticket = await testDb.one<{ id: number }>(
        "SELECT id FROM tickets WHERE code = $1",
        [result.code],
      );

      await assignTicket(ticket.id, user.id, org.id);
      await addComment(ticket.id, user.id, "Looking into this", org.id);

      const detail = await getTicketById(ticket.id, org.id);
      expect(detail.code).toBe(result.code);
      expect(detail.status).toBe("assigned");
      expect(detail.attachments).toHaveLength(1);
      expect(detail.attachments[0].filename).toBe("file.png");
      expect(detail.comments).toHaveLength(1);
      expect(detail.comments[0].content).toBe("Looking into this");
      expect(detail.assignments).toHaveLength(1);
      expect(detail.assignments[0].assignedToName).toBe("Operator");
    });

    it("throws NotFoundError for non-existent ticket", async () => {
      const org = await ensureDefaultOrganization();
      await expect(getTicketById(9999, org.id)).rejects.toThrow(
        new NotFoundError("Ticket not found"),
      );
    });

    it("throws NotFoundError for ticket in different organization", async () => {
      const org1 = await ensureDefaultOrganization();
      const org2 = await createOrganization("Other Org");

      const result = await createTicket(validInput, org2.id);
      const ticket = await testDb.one<{ id: number }>(
        "SELECT id FROM tickets WHERE code = $1",
        [result.code],
      );

      await expect(getTicketById(ticket.id, org1.id)).rejects.toThrow(
        new NotFoundError("Ticket not found"),
      );
    });
  });

  describe("getTicketByCode", () => {
    it("returns ticket status info", async () => {
      const org = await ensureDefaultOrganization();
      const result = await createTicket(validInput, org.id);

      const status = await getTicketByCode(result.code, org.id);
      expect(status.code).toBe(result.code);
      expect(status.status).toBe("new");
      expect(status.createdAt).toBeDefined();
      expect(status.updatedAt).toBeDefined();
    });

    it("throws NotFoundError for non-existent code", async () => {
      const org = await ensureDefaultOrganization();
      await expect(getTicketByCode("TK-ZZZZZZZZ", org.id)).rejects.toThrow(
        new NotFoundError("Ticket not found"),
      );
    });
  });

  describe("assignTicket", () => {
    it("changes status from new to assigned and creates assignment history", async () => {
      const org = await ensureDefaultOrganization();
      const user = await createUser(org.id, "Operator", "op@test.com");
      const result = await createTicket(validInput, org.id);
      const ticket = await testDb.one<{ id: number }>(
        "SELECT id FROM tickets WHERE code = $1",
        [result.code],
      );

      await assignTicket(ticket.id, user.id, org.id);

      const updated = await testDb.one<{ status: string; assignedToId: number }>(
        `SELECT status, assigned_to_id AS "assignedToId" FROM tickets WHERE id = $1`,
        [ticket.id],
      );
      expect(updated.status).toBe("assigned");
      expect(updated.assignedToId).toBe(user.id);

      const assignments = await testDb.manyOrNone(
        "SELECT * FROM ticket_assignments WHERE ticket_id = $1",
        [ticket.id],
      );
      expect(assignments).toHaveLength(1);
    });

    it("throws ValidationError on already-assigned ticket", async () => {
      const org = await ensureDefaultOrganization();
      const user = await createUser(org.id, "Operator", "op@test.com");
      const result = await createTicket(validInput, org.id);
      const ticket = await testDb.one<{ id: number }>(
        "SELECT id FROM tickets WHERE code = $1",
        [result.code],
      );

      await assignTicket(ticket.id, user.id, org.id);

      await expect(assignTicket(ticket.id, user.id, org.id)).rejects.toThrow(
        new ValidationError("Only new tickets can be assigned"),
      );
    });

    it("throws NotFoundError for non-existent ticket", async () => {
      const org = await ensureDefaultOrganization();
      const user = await createUser(org.id, "Operator", "op@test.com");
      await expect(assignTicket(9999, user.id, org.id)).rejects.toThrow(
        new NotFoundError("Ticket not found"),
      );
    });
  });

  describe("forwardTicket", () => {
    it("updates assignee and creates assignment history entry", async () => {
      const org = await ensureDefaultOrganization();
      const user1 = await createUser(org.id, "Operator 1", "op1@test.com");
      const user2 = await createUser(org.id, "Operator 2", "op2@test.com");

      const result = await createTicket(validInput, org.id);
      const ticket = await testDb.one<{ id: number }>(
        "SELECT id FROM tickets WHERE code = $1",
        [result.code],
      );

      await assignTicket(ticket.id, user1.id, org.id);
      await forwardTicket(ticket.id, user2.id, user1.id, org.id);

      const updated = await testDb.one<{ assignedToId: number }>(
        `SELECT assigned_to_id AS "assignedToId" FROM tickets WHERE id = $1`,
        [ticket.id],
      );
      expect(updated.assignedToId).toBe(user2.id);

      const assignments = await testDb.manyOrNone(
        "SELECT * FROM ticket_assignments WHERE ticket_id = $1 ORDER BY created_at ASC",
        [ticket.id],
      );
      expect(assignments).toHaveLength(2);
    });

    it("throws ValidationError when forwarding to same user", async () => {
      const org = await ensureDefaultOrganization();
      const user = await createUser(org.id, "Operator", "op@test.com");

      const result = await createTicket(validInput, org.id);
      const ticket = await testDb.one<{ id: number }>(
        "SELECT id FROM tickets WHERE code = $1",
        [result.code],
      );

      await assignTicket(ticket.id, user.id, org.id);

      await expect(
        forwardTicket(ticket.id, user.id, user.id, org.id),
      ).rejects.toThrow(
        new ValidationError("Cannot forward ticket to the same user currently assigned"),
      );
    });

    it("throws ValidationError when forwarding to user in different organization", async () => {
      const org1 = await ensureDefaultOrganization();
      const org2 = await createOrganization("Other Org");
      const user1 = await createUser(org1.id, "Operator 1", "op1@test.com");
      const user2 = await createUser(org2.id, "Operator 2", "op2@test.com");

      const result = await createTicket(validInput, org1.id);
      const ticket = await testDb.one<{ id: number }>(
        "SELECT id FROM tickets WHERE code = $1",
        [result.code],
      );

      await assignTicket(ticket.id, user1.id, org1.id);

      await expect(
        forwardTicket(ticket.id, user2.id, user1.id, org1.id),
      ).rejects.toThrow(
        new ValidationError("Target user not found in the same organization"),
      );
    });

    it("throws ValidationError on non-assigned ticket", async () => {
      const org = await ensureDefaultOrganization();
      const user1 = await createUser(org.id, "Operator 1", "op1@test.com");
      const user2 = await createUser(org.id, "Operator 2", "op2@test.com");

      const result = await createTicket(validInput, org.id);
      const ticket = await testDb.one<{ id: number }>(
        "SELECT id FROM tickets WHERE code = $1",
        [result.code],
      );

      await expect(
        forwardTicket(ticket.id, user2.id, user1.id, org.id),
      ).rejects.toThrow(
        new ValidationError("Only assigned tickets can be forwarded"),
      );
    });
  });

  describe("closeTicket", () => {
    it("changes status from assigned to closed", async () => {
      const org = await ensureDefaultOrganization();
      const user = await createUser(org.id, "Operator", "op@test.com");

      const result = await createTicket(validInput, org.id);
      const ticket = await testDb.one<{ id: number }>(
        "SELECT id FROM tickets WHERE code = $1",
        [result.code],
      );

      await assignTicket(ticket.id, user.id, org.id);
      await closeTicket(ticket.id, org.id);

      const updated = await testDb.one<{ status: string }>(
        "SELECT status FROM tickets WHERE id = $1",
        [ticket.id],
      );
      expect(updated.status).toBe("closed");
    });

    it("throws ValidationError on non-assigned ticket", async () => {
      const org = await ensureDefaultOrganization();
      const result = await createTicket(validInput, org.id);
      const ticket = await testDb.one<{ id: number }>(
        "SELECT id FROM tickets WHERE code = $1",
        [result.code],
      );

      await expect(closeTicket(ticket.id, org.id)).rejects.toThrow(
        new ValidationError("Only assigned tickets can be closed"),
      );
    });

    it("throws NotFoundError for non-existent ticket", async () => {
      const org = await ensureDefaultOrganization();
      await expect(closeTicket(9999, org.id)).rejects.toThrow(
        new NotFoundError("Ticket not found"),
      );
    });
  });

  describe("addComment", () => {
    it("creates comment with text and optional attachments", async () => {
      const org = await ensureDefaultOrganization();
      const user = await createUser(org.id, "Operator", "op@test.com");
      const result = await createTicket(validInput, org.id);
      const ticket = await testDb.one<{ id: number }>(
        "SELECT id FROM tickets WHERE code = $1",
        [result.code],
      );

      const comment = await addComment(
        ticket.id,
        user.id,
        "This is a comment",
        org.id,
        [{ filename: "note.txt", contentType: "text/plain", content: "dGVzdA==" }],
      );

      expect(comment.id).toBeDefined();

      const comments = await testDb.manyOrNone(
        "SELECT * FROM ticket_comments WHERE ticket_id = $1",
        [ticket.id],
      );
      expect(comments).toHaveLength(1);
      expect(comments[0].content).toBe("This is a comment");

      const attachments = await testDb.manyOrNone(
        "SELECT * FROM ticket_attachments WHERE ticket_comment_id = $1",
        [comment.id],
      );
      expect(attachments).toHaveLength(1);
      expect(attachments[0].filename).toBe("note.txt");
    });

    it("throws NotFoundError on non-existent ticket", async () => {
      const org = await ensureDefaultOrganization();
      const user = await createUser(org.id, "Operator", "op@test.com");

      await expect(
        addComment(9999, user.id, "Comment", org.id),
      ).rejects.toThrow(new NotFoundError("Ticket not found"));
    });

    it("throws ValidationError when content is empty", async () => {
      const org = await ensureDefaultOrganization();
      const user = await createUser(org.id, "Operator", "op@test.com");
      const result = await createTicket(validInput, org.id);
      const ticket = await testDb.one<{ id: number }>(
        "SELECT id FROM tickets WHERE code = $1",
        [result.code],
      );

      await expect(
        addComment(ticket.id, user.id, "", org.id),
      ).rejects.toThrow(new ValidationError("Content is required"));
    });

    it("creates comment without attachments", async () => {
      const org = await ensureDefaultOrganization();
      const user = await createUser(org.id, "Operator", "op@test.com");
      const result = await createTicket(validInput, org.id);
      const ticket = await testDb.one<{ id: number }>(
        "SELECT id FROM tickets WHERE code = $1",
        [result.code],
      );

      const comment = await addComment(ticket.id, user.id, "Just text", org.id);
      expect(comment.id).toBeDefined();

      const attachments = await testDb.manyOrNone(
        "SELECT * FROM ticket_attachments WHERE ticket_comment_id = $1",
        [comment.id],
      );
      expect(attachments).toHaveLength(0);
    });
  });
});
