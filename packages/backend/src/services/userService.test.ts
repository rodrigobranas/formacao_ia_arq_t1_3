import bcrypt from "bcrypt";
import {
  create,
  DuplicateEmailError,
  ForbiddenError,
  list,
  NotFoundError,
  remove,
  ValidationError,
  PasswordLengthError,
} from "./userService";
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

async function insertUser(params: {
  organizationId: number;
  name?: string;
  email: string;
  password?: string;
  admin?: boolean;
}) {
  const passwordHash = await bcrypt.hash(params.password ?? "password123", 10);

  return testDb.one<{
    id: number;
    name: string;
    email: string;
    admin: boolean;
    password: string;
  }>(
    `INSERT INTO users (name, email, password, admin, organization_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, admin, password`,
    [
      params.name ?? "Existing User",
      params.email.toLowerCase(),
      passwordHash,
      params.admin ?? false,
      params.organizationId,
    ],
  );
}

describe("userService", () => {
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

  it("list() returns all users in the given organization without password field", async () => {
    const defaultOrganization = await ensureDefaultOrganization();
    const otherOrganization = await createOrganization("Other Org");
    await insertUser({
      organizationId: defaultOrganization.id,
      name: "Zelda Admin",
      email: "zelda@example.com",
      admin: true,
    });
    await insertUser({
      organizationId: defaultOrganization.id,
      name: "Ana Member",
      email: "ana@example.com",
      admin: false,
    });
    await insertUser({
      organizationId: otherOrganization.id,
      name: "Other Tenant",
      email: "other@example.com",
      admin: false,
    });

    await expect(list(defaultOrganization.id)).resolves.toEqual([
      {
        id: expect.any(Number),
        name: "Ana Member",
        email: "ana@example.com",
        admin: false,
      },
      {
        id: expect.any(Number),
        name: "Zelda Admin",
        email: "zelda@example.com",
        admin: true,
      },
    ]);
  });

  it("create() creates user with hashed password in the given organization", async () => {
    const organization = await ensureDefaultOrganization();

    const createdUser = await create(
      {
        name: "New User",
        email: "NEW@example.com",
        password: "password123",
        admin: true,
      },
      organization.id,
    );

    expect(createdUser).toEqual({
      id: expect.any(Number),
      name: "New User",
      email: "new@example.com",
      admin: true,
    });

    const storedUser = await testDb.one<{ password: string; organizationId: number }>(
      `SELECT password, organization_id AS "organizationId"
       FROM users
       WHERE id = $1`,
      [createdUser.id],
    );

    expect(storedUser.organizationId).toBe(organization.id);
    expect(storedUser.password).not.toBe("password123");
    await expect(bcrypt.compare("password123", storedUser.password)).resolves.toBe(true);
  });

  it.each([
    [{ email: "user@example.com", password: "password123", admin: false }, "Name is required"],
    [{ name: "User", password: "password123", admin: false }, "Email is required"],
    [{ name: "User", email: "user@example.com", admin: false }, "Password is required"],
    [{ name: "User", email: "user@example.com", password: "password123" }, "Admin is required"],
  ])("create() returns validation error when required fields are missing", async (input, message) => {
    const organization = await ensureDefaultOrganization();

    await expect(create(input as never, organization.id)).rejects.toThrow(
      new ValidationError(message),
    );
  });

  it("create() returns error when email is already in use in the same organization", async () => {
    const organization = await ensureDefaultOrganization();
    await insertUser({
      organizationId: organization.id,
      email: "duplicate@example.com",
    });

    await expect(
      create(
        {
          name: "Another User",
          email: "duplicate@example.com",
          password: "password123",
          admin: false,
        },
        organization.id,
      ),
    ).rejects.toThrow(new DuplicateEmailError("Email is already in use"));
  });

  it("create() returns error when email is already in use in a different organization", async () => {
    const defaultOrganization = await ensureDefaultOrganization();
    const otherOrganization = await createOrganization("Other Org");
    await insertUser({
      organizationId: otherOrganization.id,
      email: "duplicate@example.com",
    });

    await expect(
      create(
        {
          name: "Another User",
          email: "duplicate@example.com",
          password: "password123",
          admin: false,
        },
        defaultOrganization.id,
      ),
    ).rejects.toThrow(new DuplicateEmailError("Email is already in use"));
  });

  it("create() returns error when password is shorter than 8 characters", async () => {
    const organization = await ensureDefaultOrganization();

    await expect(
      create(
        {
          name: "Short Password",
          email: "short@example.com",
          password: "short",
          admin: false,
        },
        organization.id,
      ),
    ).rejects.toThrow(new PasswordLengthError("Password must be at least 8 characters"));
  });

  it("remove() removes user belonging to the given organization", async () => {
    const organization = await ensureDefaultOrganization();
    const existingUser = await insertUser({
      organizationId: organization.id,
      email: "remove@example.com",
    });

    await expect(remove(existingUser.id, organization.id, 9999)).resolves.toBeUndefined();
    await expect(list(organization.id)).resolves.toEqual([]);
  });

  it("remove() returns NotFoundError for user in a different organization", async () => {
    const defaultOrganization = await ensureDefaultOrganization();
    const otherOrganization = await createOrganization("Other Org");
    const existingUser = await insertUser({
      organizationId: otherOrganization.id,
      email: "other@example.com",
    });

    await expect(remove(existingUser.id, defaultOrganization.id, 9999)).rejects.toThrow(
      new NotFoundError("User not found"),
    );
  });

  it("remove() returns error when admin tries to delete themselves", async () => {
    const organization = await ensureDefaultOrganization();
    const existingUser = await insertUser({
      organizationId: organization.id,
      email: "self@example.com",
      admin: true,
    });

    await expect(remove(existingUser.id, organization.id, existingUser.id)).rejects.toThrow(
      new ForbiddenError("Admin cannot delete themselves"),
    );
  });
});
