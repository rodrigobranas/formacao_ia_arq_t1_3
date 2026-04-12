import {
  changeName,
  get,
  NameLengthError,
  NotFoundError,
  ValidationError,
} from "./organizationService";
import {
  closeTestDatabase,
  ensureDefaultOrganization,
  testDb,
  truncateTables,
  verifyTestDatabaseConnection,
} from "../data/testHelper";

async function createOrganization(name: string) {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  return testDb.one<{ id: number; name: string }>(
    "INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id, name",
    [name, slug],
  );
}

describe("organizationService", () => {
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

  it("get() returns the organization by id", async () => {
    const organization = await createOrganization("Acme Org");

    await expect(get(organization.id)).resolves.toEqual({
      id: organization.id,
      name: "Acme Org",
      slug: "acme-org",
    });
  });

  it("get() returns null for a non-existent organization", async () => {
    await expect(get(9999)).resolves.toBeNull();
  });

  it("changeName() updates the organization name", async () => {
    const organization = await ensureDefaultOrganization();

    await expect(changeName(organization.id, { name: "  Renamed Org  " })).resolves.toEqual({
      id: organization.id,
      name: "Renamed Org",
      slug: "default",
    });

    await expect(get(organization.id)).resolves.toEqual({
      id: organization.id,
      name: "Renamed Org",
      slug: "default",
    });
  });

  it("changeName() returns validation error for empty name", async () => {
    const organization = await ensureDefaultOrganization();

    await expect(changeName(organization.id, { name: "   " })).rejects.toThrow(
      new ValidationError("Name is required"),
    );
  });

  it("changeName() returns validation error for name exceeding 100 characters", async () => {
    const organization = await ensureDefaultOrganization();

    await expect(changeName(organization.id, { name: "a".repeat(101) })).rejects.toThrow(
      new NameLengthError("Name must be at most 100 characters"),
    );
  });

  it("changeName() returns NotFoundError for a non-existent organization", async () => {
    await expect(changeName(9999, { name: "Renamed Org" })).rejects.toThrow(
      new NotFoundError("Organization not found"),
    );
  });
});
