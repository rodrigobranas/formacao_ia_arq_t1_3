import {
  closeTestDatabase,
  DEFAULT_ORGANIZATION_NAME,
  ensureDefaultOrganization,
  testDb,
  truncateTables,
  verifyTestDatabaseConnection,
} from "./testHelper";

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

describe("testHelper", () => {
  beforeAll(async () => {
    await verifyTestDatabaseConnection();
  });

  afterAll(async () => {
    await truncateTables();
    await closeTestDatabase();
  });

  it("connects to PostgreSQL successfully", async () => {
    const result = await verifyTestDatabaseConnection();

    expect(result).toEqual({ connected: 1 });
  });

  it("creates the organizations table with the expected columns", async () => {
    const columns = await testDb.manyOrNone<{ columnName: string; dataType: string; isNullable: string }>(
      `SELECT
         column_name AS "columnName",
         data_type AS "dataType",
         is_nullable AS "isNullable"
       FROM information_schema.columns
       WHERE table_name = 'organizations'
       ORDER BY ordinal_position`,
    );

    expect(columns).toEqual([
      { columnName: "id", dataType: "integer", isNullable: "NO" },
      { columnName: "name", dataType: "character varying", isNullable: "NO" },
      { columnName: "slug", dataType: "character varying", isNullable: "NO" },
    ]);
  });

  it("creates the users table with the expected columns", async () => {
    const columns = await testDb.manyOrNone<{ columnName: string; dataType: string; isNullable: string }>(
      `SELECT
         column_name AS "columnName",
         data_type AS "dataType",
         is_nullable AS "isNullable"
       FROM information_schema.columns
       WHERE table_name = 'users'
       ORDER BY ordinal_position`,
    );

    expect(columns).toEqual([
      { columnName: "id", dataType: "integer", isNullable: "NO" },
      { columnName: "name", dataType: "character varying", isNullable: "NO" },
      { columnName: "email", dataType: "character varying", isNullable: "NO" },
      { columnName: "password", dataType: "character varying", isNullable: "NO" },
      { columnName: "admin", dataType: "boolean", isNullable: "NO" },
      { columnName: "organization_id", dataType: "integer", isNullable: "NO" },
    ]);
  });

  it("creates the default organization during initialization", async () => {
    const defaultOrganization = await testDb.oneOrNone<{ id: number; name: string }>(
      "SELECT id, name FROM organizations WHERE name = $1",
      [DEFAULT_ORGANIZATION_NAME],
    );

    expect(defaultOrganization).toEqual({
      id: expect.any(Number),
      name: DEFAULT_ORGANIZATION_NAME,
    });
  });

  it("assigns seeded ticket types to the default organization", async () => {
    await truncateTables();
    const defaultOrganization = await ensureDefaultOrganization();

    for (const ticketType of seededTicketTypes) {
      await testDb.none(
        "INSERT INTO ticket_types (name, description, organization_id) VALUES ($1, $2, $3)",
        [ticketType.name, ticketType.description, defaultOrganization.id],
      );
    }

    const rows = await testDb.manyOrNone<{ ticketTypeName: string; organizationName: string }>(
      `SELECT
         tt.name AS "ticketTypeName",
         o.name AS "organizationName"
       FROM ticket_types tt
       JOIN organizations o ON o.id = tt.organization_id
       ORDER BY tt.name ASC`,
    );

    expect(rows).toEqual([
      { ticketTypeName: "Customização", organizationName: DEFAULT_ORGANIZATION_NAME },
      { ticketTypeName: "Dúvida", organizationName: DEFAULT_ORGANIZATION_NAME },
      { ticketTypeName: "Inconsistência", organizationName: DEFAULT_ORGANIZATION_NAME },
      { ticketTypeName: "Sugestão", organizationName: DEFAULT_ORGANIZATION_NAME },
    ]);
  });

  it("contains the seeded ticket types after a database reset", async () => {
    await truncateTables();
    const defaultOrganization = await ensureDefaultOrganization();

    for (const ticketType of seededTicketTypes) {
      await testDb.none(
        "INSERT INTO ticket_types (name, description, organization_id) VALUES ($1, $2, $3)",
        [ticketType.name, ticketType.description, defaultOrganization.id],
      );
    }

    const rows = await testDb.manyOrNone<{ name: string; description: string }>(
      "SELECT name, description FROM ticket_types ORDER BY name ASC",
    );

    expect(rows).toEqual([
      {
        name: "Customização",
        description: "Solicitações de personalização e ajustes",
      },
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
    ]);
  });

  it("rejects invalid ticket_type_id foreign keys", async () => {
    await truncateTables();
    const defaultOrganization = await ensureDefaultOrganization();

    await expect(
      testDb.none(
        `INSERT INTO tickets (code, name, email, phone, description, ticket_type_id, organization_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ["TK-FKTST1", "Test User", "test@test.com", "123456789", "Test ticket", 999, defaultOrganization.id],
      ),
    ).rejects.toThrow(/foreign key/i);
  });

  it("enforces case-insensitive uniqueness for ticket type names", async () => {
    await truncateTables();
    const defaultOrganization = await ensureDefaultOrganization();

    await testDb.none(
      "INSERT INTO ticket_types (name, description, organization_id) VALUES ($1, $2, $3)",
      ["Dúvida", "Chamados relacionados a dúvidas e esclarecimentos", defaultOrganization.id],
    );

    await expect(
      testDb.none(
        "INSERT INTO ticket_types (name, description, organization_id) VALUES ($1, $2, $3)",
        ["dúvida", "Duplicated name should fail", defaultOrganization.id],
      ),
    ).rejects.toThrow(/duplicate key/i);
  });

  it("enforces case-insensitive uniqueness for user emails", async () => {
    await truncateTables();
    const defaultOrganization = await ensureDefaultOrganization();

    await testDb.none(
      `INSERT INTO users (name, email, password, organization_id)
       VALUES ($1, $2, $3, $4)`,
      ["User One", "Test@email.com", "secret", defaultOrganization.id],
    );

    await expect(
      testDb.none(
        `INSERT INTO users (name, email, password, organization_id)
         VALUES ($1, $2, $3, $4)`,
        ["User Two", "test@email.com", "secret", defaultOrganization.id],
      ),
    ).rejects.toThrow(/duplicate key/i);
  });

  it("rejects invalid organization references for users", async () => {
    await truncateTables();

    await expect(
      testDb.none(
        `INSERT INTO users (name, email, password, organization_id)
         VALUES ($1, $2, $3, $4)`,
        ["User One", "user@example.com", "secret", 999],
      ),
    ).rejects.toThrow(/foreign key/i);
  });

  it("enforces organization_id as required on ticket_types", async () => {
    await truncateTables();

    await expect(
      testDb.none(
        "INSERT INTO ticket_types (name, description, organization_id) VALUES ($1, $2, $3)",
        ["Operacional", "Fluxo de teste", null],
      ),
    ).rejects.toThrow(/null value/i);
  });

  it("enforces organization_id as required on tickets", async () => {
    await truncateTables();
    const defaultOrganization = await ensureDefaultOrganization();
    const insertedTicketType = await testDb.one<{ id: number }>(
      `INSERT INTO ticket_types (name, description, organization_id)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ["Operacional", "Fluxo de teste", defaultOrganization.id],
    );

    await expect(
      testDb.none(
        `INSERT INTO tickets (code, name, email, phone, description, ticket_type_id, organization_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ["TK-NLORG1", "Test User", "test@test.com", "123456789", "Test ticket", insertedTicketType.id, null],
      ),
    ).rejects.toThrow(/null value/i);
  });

  it("allows the same ticket type name in different organizations", async () => {
    await truncateTables();
    const defaultOrganization = await ensureDefaultOrganization();
    const secondOrganization = await testDb.one<{ id: number }>(
      "INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id",
      ["Second Org", "second-org"],
    );

    await testDb.none(
      `INSERT INTO ticket_types (name, description, organization_id)
       VALUES ($1, $2, $3), ($1, $4, $5)`,
      ["Operacional", "Org 1", defaultOrganization.id, "Org 2", secondOrganization.id],
    );

    const count = await testDb.one<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM ticket_types WHERE LOWER(name) = LOWER($1)",
      ["Operacional"],
    );

    expect(count).toEqual({ count: "2" });
  });

  it("prevents duplicate ticket type names within the same organization", async () => {
    await truncateTables();
    const defaultOrganization = await ensureDefaultOrganization();

    await testDb.none(
      `INSERT INTO ticket_types (name, description, organization_id)
       VALUES ($1, $2, $3)`,
      ["Operacional", "Primeiro", defaultOrganization.id],
    );

    await expect(
      testDb.none(
        `INSERT INTO ticket_types (name, description, organization_id)
         VALUES ($1, $2, $3)`,
        ["operacional", "Duplicado", defaultOrganization.id],
      ),
    ).rejects.toThrow(/duplicate key/i);
  });

  it("stores ticket rows with a valid default organization reference", async () => {
    await truncateTables();
    const defaultOrganization = await ensureDefaultOrganization();
    const insertedTicketType = await testDb.one<{ id: number }>(
      `INSERT INTO ticket_types (name, description, organization_id)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ["Operacional", "Fluxo de teste", defaultOrganization.id],
    );

    await testDb.none(
      `INSERT INTO tickets (code, name, email, phone, description, ticket_type_id, organization_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ["TK-DORG01", "Test User", "test@test.com", "123456789", "Test ticket", insertedTicketType.id, defaultOrganization.id],
    );

    const rows = await testDb.manyOrNone<{ organizationName: string }>(
      `SELECT o.name AS "organizationName"
       FROM tickets t
       JOIN organizations o ON o.id = t.organization_id`,
    );

    expect(rows).toEqual([{ organizationName: DEFAULT_ORGANIZATION_NAME }]);
  });

  it("truncates multi-tenant tables for test isolation and restores the default organization", async () => {
    await truncateTables();
    const defaultOrganization = await ensureDefaultOrganization();

    const insertedTicketType = await testDb.one<{ id: number }>(
      `INSERT INTO ticket_types (name, description, organization_id)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ["Operacional", "Fluxo de teste", defaultOrganization.id],
    );

    await testDb.none(
      `INSERT INTO tickets (code, name, email, phone, description, ticket_type_id, organization_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ["TK-TRNC01", "Test User", "test@test.com", "123456789", "Test ticket", insertedTicketType.id, defaultOrganization.id],
    );
    await testDb.none(
      `INSERT INTO users (name, email, password, organization_id)
       VALUES ($1, $2, $3, $4)`,
      ["User One", "user@example.com", "secret", defaultOrganization.id],
    );

    await truncateTables();

    const counts = await testDb.one<{
      organizations: string;
      users: string;
      ticketTypes: string;
      tickets: string;
    }>(
      `SELECT
         (SELECT COUNT(*) FROM organizations) AS organizations,
         (SELECT COUNT(*) FROM users) AS users,
         (SELECT COUNT(*) FROM ticket_types) AS "ticketTypes",
         (SELECT COUNT(*) FROM tickets) AS tickets`,
    );

    expect(counts).toEqual({
      organizations: "1",
      users: "0",
      ticketTypes: "0",
      tickets: "0",
    });
  });
});
