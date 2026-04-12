import jwt from "jsonwebtoken";
import request from "supertest";
import { app } from "../index";
import {
  closeTestDatabase,
  ensureDefaultOrganization,
  testDb,
  truncateTables,
  verifyTestDatabaseConnection,
} from "../data/testHelper";

type TicketTypeRow = {
  id: number;
  name: string;
  description: string | null;
};

const JWT_SECRET = "test-secret";

async function createOrganization(name: string) {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  return testDb.one<{ id: number; name: string }>(
    "INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id, name",
    [name, slug],
  );
}

async function insertTicketType(
  organizationId: number,
  name: string,
  description: string | null = null,
) {
  return testDb.one<TicketTypeRow>(
    `INSERT INTO ticket_types (name, description, organization_id)
     VALUES ($1, $2, $3)
     RETURNING id, name, description`,
    [name, description, organizationId],
  );
}

function signToken(payload: { userId: number; organizationId: number; admin: boolean }) {
  return jwt.sign(payload, JWT_SECRET);
}

describe("/api/ticket-types", () => {
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

  it("GET /api/ticket-types returns 401 without auth token", async () => {
    const response = await request(app).get("/api/ticket-types");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Token not provided" });
  });

  it("GET /api/ticket-types returns 200 with ticket types in alphabetical order for the authenticated organization", async () => {
    const defaultOrganization = await ensureDefaultOrganization();
    const otherOrganization = await createOrganization("Other Org");
    await insertTicketType(defaultOrganization.id, "Sugestão", "Ideias e sugestões de melhoria");
    await insertTicketType(
      defaultOrganization.id,
      "Customização",
      "Solicitações de personalização e ajustes",
    );
    await insertTicketType(
      defaultOrganization.id,
      "Dúvida",
      "Chamados relacionados a dúvidas e esclarecimentos",
    );
    await insertTicketType(otherOrganization.id, "Financeiro", "Outro tenant");

    const response = await request(app)
      .get("/api/ticket-types")
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: 1, organizationId: defaultOrganization.id, admin: false })}`,
      );

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: expect.any(Number),
        name: "Customização",
        description: "Solicitações de personalização e ajustes",
      },
      {
        id: expect.any(Number),
        name: "Dúvida",
        description: "Chamados relacionados a dúvidas e esclarecimentos",
      },
      {
        id: expect.any(Number),
        name: "Sugestão",
        description: "Ideias e sugestões de melhoria",
      },
    ]);
  });

  it("GET /api/ticket-types returns 200 with an empty array when no types exist for the organization", async () => {
    const defaultOrganization = await ensureDefaultOrganization();
    const otherOrganization = await createOrganization("Other Org");
    await insertTicketType(otherOrganization.id, "Financeiro", "Outro tenant");

    const response = await request(app)
      .get("/api/ticket-types")
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: 1, organizationId: defaultOrganization.id, admin: false })}`,
      );

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("POST /api/ticket-types returns 403 with non-admin token", async () => {
    const defaultOrganization = await ensureDefaultOrganization();

    const response = await request(app)
      .post("/api/ticket-types")
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: 1, organizationId: defaultOrganization.id, admin: false })}`,
      )
      .send({ name: "Operacional", description: "Fluxo de atendimento interno" });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: "Admin access required" });
  });

  it("POST /api/ticket-types returns 201 with the created ticket type for the authenticated organization", async () => {
    const defaultOrganization = await ensureDefaultOrganization();

    const response = await request(app)
      .post("/api/ticket-types")
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: 1, organizationId: defaultOrganization.id, admin: true })}`,
      )
      .send({ name: "Operacional", description: "Fluxo de atendimento interno" });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(Number),
      name: "Operacional",
      description: "Fluxo de atendimento interno",
    });

    await expect(
      testDb.one<{ organizationId: number }>(
        "SELECT organization_id AS \"organizationId\" FROM ticket_types WHERE id = $1",
        [response.body.id],
      ),
    ).resolves.toEqual({ organizationId: defaultOrganization.id });
  });

  it("POST /api/ticket-types returns 400 when name is missing", async () => {
    const defaultOrganization = await ensureDefaultOrganization();

    const response = await request(app)
      .post("/api/ticket-types")
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: 1, organizationId: defaultOrganization.id, admin: true })}`,
      )
      .send({ description: "Sem nome" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Name is required" });
  });

  it("POST /api/ticket-types returns 400 when name exceeds 50 characters", async () => {
    const defaultOrganization = await ensureDefaultOrganization();

    const response = await request(app)
      .post("/api/ticket-types")
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: 1, organizationId: defaultOrganization.id, admin: true })}`,
      )
      .send({ name: "A".repeat(51), description: "Nome inválido" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Name must be at most 50 characters" });
  });

  it("POST /api/ticket-types returns 400 when description exceeds 255 characters", async () => {
    const defaultOrganization = await ensureDefaultOrganization();

    const response = await request(app)
      .post("/api/ticket-types")
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: 1, organizationId: defaultOrganization.id, admin: true })}`,
      )
      .send({ name: "Operacional", description: "B".repeat(256) });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Description must be at most 255 characters" });
  });

  it("POST /api/ticket-types returns 400 for duplicate names ignoring case", async () => {
    const defaultOrganization = await ensureDefaultOrganization();
    await insertTicketType(defaultOrganization.id, "Operacional", "Primeiro cadastro");

    const response = await request(app)
      .post("/api/ticket-types")
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: 1, organizationId: defaultOrganization.id, admin: true })}`,
      )
      .send({ name: "operacional", description: "Duplicado" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "A ticket type with this name already exists" });
  });

  it("PUT /api/ticket-types/:id returns 403 with non-admin token", async () => {
    const defaultOrganization = await ensureDefaultOrganization();
    const ticketType = await insertTicketType(defaultOrganization.id, "Operacional", "Fluxo inicial");

    const response = await request(app)
      .put(`/api/ticket-types/${ticketType.id}`)
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: 1, organizationId: defaultOrganization.id, admin: false })}`,
      )
      .send({ name: "Operacional VIP", description: "Fluxo atualizado" });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: "Admin access required" });
  });

  it("PUT /api/ticket-types/:id returns 200 with the updated ticket type", async () => {
    const defaultOrganization = await ensureDefaultOrganization();
    const ticketType = await insertTicketType(defaultOrganization.id, "Operacional", "Fluxo inicial");

    const response = await request(app)
      .put(`/api/ticket-types/${ticketType.id}`)
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: 1, organizationId: defaultOrganization.id, admin: true })}`,
      )
      .send({ name: "Operacional VIP", description: "Fluxo atualizado" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: ticketType.id,
      name: "Operacional VIP",
      description: "Fluxo atualizado",
    });
  });

  it("PUT /api/ticket-types/:id returns 404 for a non-existent id", async () => {
    const defaultOrganization = await ensureDefaultOrganization();

    const response = await request(app)
      .put("/api/ticket-types/999")
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: 1, organizationId: defaultOrganization.id, admin: true })}`,
      )
      .send({ name: "Inexistente", description: "Sem registro" });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Ticket type not found" });
  });

  it("PUT /api/ticket-types/:id returns 400 when another record already uses the name", async () => {
    const defaultOrganization = await ensureDefaultOrganization();
    const firstTicketType = await insertTicketType(defaultOrganization.id, "Operacional", "Primeiro");
    await insertTicketType(defaultOrganization.id, "Financeiro", "Segundo");

    const response = await request(app)
      .put(`/api/ticket-types/${firstTicketType.id}`)
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: 1, organizationId: defaultOrganization.id, admin: true })}`,
      )
      .send({ name: "financeiro", description: "Duplicado" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "A ticket type with this name already exists" });
  });

  it("DELETE /api/ticket-types/:id returns 403 with non-admin token", async () => {
    const defaultOrganization = await ensureDefaultOrganization();
    const ticketType = await insertTicketType(defaultOrganization.id, "Operacional", "Primeiro");

    const response = await request(app)
      .delete(`/api/ticket-types/${ticketType.id}`)
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: 1, organizationId: defaultOrganization.id, admin: false })}`,
      );

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: "Admin access required" });
  });

  it("DELETE /api/ticket-types/:id returns 204 for an unused type", async () => {
    const defaultOrganization = await ensureDefaultOrganization();
    const ticketType = await insertTicketType(defaultOrganization.id, "Operacional", "Primeiro");

    const response = await request(app)
      .delete(`/api/ticket-types/${ticketType.id}`)
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: 1, organizationId: defaultOrganization.id, admin: true })}`,
      );

    expect(response.status).toBe(204);
    expect(response.text).toBe("");
    await expect(
      testDb.manyOrNone<TicketTypeRow>("SELECT id, name, description FROM ticket_types"),
    ).resolves.toEqual([]);
  });

  it("DELETE /api/ticket-types/:id returns 409 when the type is in use", async () => {
    const defaultOrganization = await ensureDefaultOrganization();
    const ticketType = await insertTicketType(defaultOrganization.id, "Operacional", "Primeiro");
    await testDb.none(
      `INSERT INTO tickets (code, name, email, phone, description, ticket_type_id, organization_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ["TK-TDEL01", "Test User", "test@test.com", "123456789", "Test ticket", ticketType.id, defaultOrganization.id],
    );

    const response = await request(app)
      .delete(`/api/ticket-types/${ticketType.id}`)
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: 1, organizationId: defaultOrganization.id, admin: true })}`,
      );

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: "Cannot delete ticket type that is in use by existing tickets",
    });
  });

  it("DELETE /api/ticket-types/:id returns 404 for a non-existent id", async () => {
    const defaultOrganization = await ensureDefaultOrganization();

    const response = await request(app)
      .delete("/api/ticket-types/999")
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: 1, organizationId: defaultOrganization.id, admin: true })}`,
      );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Ticket type not found" });
  });
});
