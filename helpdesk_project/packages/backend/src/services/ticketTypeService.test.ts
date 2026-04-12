import {
  ConflictError,
  create,
  InUseError,
  isInUse,
  list,
  NotFoundError,
  remove,
  type TicketType,
  update,
  ValidationError,
} from "./ticketTypeService";
import {
  closeTestDatabase,
  ensureDefaultOrganization,
  testDb,
  truncateTables,
  verifyTestDatabaseConnection,
} from "../data/testHelper";

const seededTicketTypes = [
  {
    name: "Dúvida",
    description: "Chamados relacionados a dúvidas e esclarecimentos",
  },
  {
    name: "Inconsistência",
    description: "Relatos de comportamentos inesperados ou erros",
  },
  {
    name: "Sugestão",
    description: "Ideias e sugestões de melhoria",
  },
  {
    name: "Customização",
    description: "Solicitações de personalização e ajustes",
  },
];

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
  return testDb.one<TicketType>(
    `INSERT INTO ticket_types (name, description, organization_id)
     VALUES ($1, $2, $3)
     RETURNING id, name, description`,
    [name, description, organizationId],
  );
}

let ticketCodeCounter = 0;

async function insertTicketForType(organizationId: number, ticketTypeId: number) {
  ticketCodeCounter += 1;
  await testDb.none(
    `INSERT INTO tickets (code, name, email, phone, description, ticket_type_id, organization_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [`TK-T${String(ticketCodeCounter).padStart(5, "0")}`, "Test User", "test@test.com", "123456789", "Test ticket", ticketTypeId, organizationId],
  );
}

async function seedTicketTypes(organizationId: number) {
  for (const ticketType of seededTicketTypes) {
    await insertTicketType(organizationId, ticketType.name, ticketType.description);
  }
}

describe("ticketTypeService", () => {
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

  it("list() returns seeded ticket types in alphabetical order", async () => {
    const defaultOrganization = await ensureDefaultOrganization();
    const otherOrganization = await createOrganization("Other Org");
    await seedTicketTypes(defaultOrganization.id);
    await insertTicketType(otherOrganization.id, "Zeta", "Other org type");

    await expect(list(defaultOrganization.id)).resolves.toEqual([
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
        name: "Inconsistência",
        description: "Relatos de comportamentos inesperados ou erros",
      },
      {
        id: expect.any(Number),
        name: "Sugestão",
        description: "Ideias e sugestões de melhoria",
      },
    ]);
  });

  it("list() returns an empty array after truncation", async () => {
    const defaultOrganization = await ensureDefaultOrganization();

    await expect(list(defaultOrganization.id)).resolves.toEqual([]);
  });

  it("create() returns the created ticket type with an id", async () => {
    const organization = await ensureDefaultOrganization();
    const createdTicketType = await create(
      {
        name: "Operacional",
        description: "Fluxo de atendimento interno",
      },
      organization.id,
    );

    expect(createdTicketType).toEqual({
      id: expect.any(Number),
      name: "Operacional",
      description: "Fluxo de atendimento interno",
    });

    await expect(
      testDb.one<{ organizationId: number }>(
        "SELECT organization_id AS \"organizationId\" FROM ticket_types WHERE id = $1",
        [createdTicketType.id],
      ),
    ).resolves.toEqual({ organizationId: organization.id });
  });

  it("create() throws a validation error when the name is empty", async () => {
    const organization = await ensureDefaultOrganization();
    await expect(
      create({ name: "   ", description: "Fluxo inválido" }, organization.id),
    ).rejects.toThrow(new ValidationError("Name is required"));
  });

  it("create() throws a validation error when the name exceeds 50 characters", async () => {
    const organization = await ensureDefaultOrganization();
    await expect(
      create({ name: "A".repeat(51), description: "Fluxo inválido" }, organization.id),
    ).rejects.toThrow(new ValidationError("Name must be at most 50 characters"));
  });

  it("create() throws a validation error when the description exceeds 255 characters", async () => {
    const organization = await ensureDefaultOrganization();
    await expect(
      create({ name: "Operacional", description: "B".repeat(256) }, organization.id),
    ).rejects.toThrow(new ValidationError("Description must be at most 255 characters"));
  });

  it("create() throws a uniqueness error for duplicate names ignoring case", async () => {
    const organization = await ensureDefaultOrganization();
    await create({ name: "Operacional", description: "Primeiro registro" }, organization.id);

    await expect(
      create({ name: "operacional", description: "Duplicado" }, organization.id),
    ).rejects.toThrow(new ConflictError("A ticket type with this name already exists"));
  });

  it("create() allows duplicate names across different organizations", async () => {
    const defaultOrganization = await ensureDefaultOrganization();
    const otherOrganization = await createOrganization("Other Org");

    await create({ name: "Operacional", description: "Primeiro registro" }, defaultOrganization.id);

    await expect(
      create({ name: "operacional", description: "Segundo registro" }, otherOrganization.id),
    ).resolves.toEqual({
      id: expect.any(Number),
      name: "operacional",
      description: "Segundo registro",
    });
  });

  it("update() returns the updated ticket type", async () => {
    const organization = await ensureDefaultOrganization();
    const existingTicketType = await insertTicketType(
      organization.id,
      "Operacional",
      "Fluxo inicial",
    );

    const updatedTicketType = await update(
      existingTicketType.id,
      {
        name: "Operacional VIP",
        description: "Fluxo atualizado",
      },
      organization.id,
    );

    expect(updatedTicketType).toEqual({
      id: existingTicketType.id,
      name: "Operacional VIP",
      description: "Fluxo atualizado",
    });
  });

  it("update() throws a not-found error for a non-existent id", async () => {
    const organization = await ensureDefaultOrganization();
    await expect(
      update(999, { name: "Inexistente", description: "Sem registro" }, organization.id),
    ).rejects.toThrow(new NotFoundError("Ticket type not found"));
  });

  it("update() throws a uniqueness error when another record already uses the name", async () => {
    const organization = await ensureDefaultOrganization();
    const firstTicketType = await insertTicketType(organization.id, "Operacional", "Primeiro");
    await insertTicketType(organization.id, "Financeiro", "Segundo");

    await expect(
      update(firstTicketType.id, { name: "financeiro", description: "Duplicado" }, organization.id),
    ).rejects.toThrow(new ConflictError("A ticket type with this name already exists"));
  });

  it("update() allows the same record name with different casing", async () => {
    const organization = await ensureDefaultOrganization();
    const ticketType = await insertTicketType(organization.id, "Operacional", "Primeiro");

    const updatedTicketType = await update(
      ticketType.id,
      {
        name: "operacional",
        description: "Primeiro",
      },
      organization.id,
    );

    expect(updatedTicketType).toEqual({
      id: ticketType.id,
      name: "operacional",
      description: "Primeiro",
    });
  });

  it("update() returns not found for a ticket type in another organization", async () => {
    const defaultOrganization = await ensureDefaultOrganization();
    const otherOrganization = await createOrganization("Other Org");
    const ticketType = await insertTicketType(otherOrganization.id, "Operacional", "Primeiro");

    await expect(
      update(ticketType.id, { name: "Operacional VIP" }, defaultOrganization.id),
    ).rejects.toThrow(new NotFoundError("Ticket type not found"));
  });

  it("remove() deletes an unused ticket type", async () => {
    const organization = await ensureDefaultOrganization();
    const ticketType = await insertTicketType(organization.id, "Operacional", "Primeiro");

    await expect(remove(ticketType.id, organization.id)).resolves.toBeUndefined();
    await expect(list(organization.id)).resolves.toEqual([]);
  });

  it("remove() throws an in-use error when tickets reference the type", async () => {
    const organization = await ensureDefaultOrganization();
    const ticketType = await insertTicketType(organization.id, "Operacional", "Primeiro");
    await insertTicketForType(organization.id, ticketType.id);

    await expect(remove(ticketType.id, organization.id)).rejects.toThrow(
      new InUseError("Cannot delete ticket type that is in use by existing tickets"),
    );
  });

  it("remove() throws a not-found error for a non-existent id", async () => {
    const organization = await ensureDefaultOrganization();

    await expect(remove(999, organization.id)).rejects.toThrow(
      new NotFoundError("Ticket type not found"),
    );
  });

  it("remove() throws a not-found error for a ticket type in another organization", async () => {
    const defaultOrganization = await ensureDefaultOrganization();
    const otherOrganization = await createOrganization("Other Org");
    const ticketType = await insertTicketType(otherOrganization.id, "Operacional", "Primeiro");

    await expect(remove(ticketType.id, defaultOrganization.id)).rejects.toThrow(
      new NotFoundError("Ticket type not found"),
    );
  });

  it("isInUse() returns false when no tickets reference the type", async () => {
    const organization = await ensureDefaultOrganization();
    const ticketType = await insertTicketType(organization.id, "Operacional", "Primeiro");

    await expect(isInUse(ticketType.id, organization.id)).resolves.toBe(false);
  });

  it("isInUse() returns true when at least one ticket references the type", async () => {
    const organization = await ensureDefaultOrganization();
    const ticketType = await insertTicketType(organization.id, "Operacional", "Primeiro");
    await insertTicketForType(organization.id, ticketType.id);

    await expect(isInUse(ticketType.id, organization.id)).resolves.toBe(true);
  });

  it("isInUse() ignores tickets from another organization", async () => {
    const defaultOrganization = await ensureDefaultOrganization();
    const otherOrganization = await createOrganization("Other Org");
    const ticketType = await insertTicketType(defaultOrganization.id, "Operacional", "Primeiro");
    await insertTicketForType(otherOrganization.id, ticketType.id);

    await expect(isInUse(ticketType.id, defaultOrganization.id)).resolves.toBe(false);
  });
});
