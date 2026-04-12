import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  InvalidCredentialsError,
  signin,
  signup,
  generateSlug,
  type SignupResult,
  ValidationError,
  DuplicateEmailError,
  PasswordLengthError,
} from "./authService";
import {
  closeTestDatabase,
  testDb,
  truncateTables,
  verifyTestDatabaseConnection,
} from "../data/testHelper";

const JWT_SECRET = "test-secret";

async function insertUser(params: {
  name?: string;
  email: string;
  password?: string;
  admin?: boolean;
  organizationName?: string;
}) {
  const orgName = params.organizationName ?? "Existing Org";
  const slug = orgName.toLowerCase().replace(/\s+/g, "-");
  const organization = await testDb.one<{ id: number; name: string }>(
    "INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id, name",
    [orgName, slug],
  );

  const passwordHash = await bcrypt.hash(params.password ?? "password123", 10);

  return testDb.one<{
    id: number;
    name: string;
    email: string;
    admin: boolean;
    organizationId: number;
  }>(
    `INSERT INTO users (name, email, password, admin, organization_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, admin, organization_id AS "organizationId"`,
    [
      params.name ?? "Existing User",
      params.email.toLowerCase(),
      passwordHash,
      params.admin ?? false,
      organization.id,
    ],
  );
}

describe("generateSlug", () => {
  it("converts 'Acme Corp' to 'acme-corp'", () => {
    expect(generateSlug("Acme Corp")).toBe("acme-corp");
  });

  it("converts 'My   Company!!!' to 'my-company'", () => {
    expect(generateSlug("My   Company!!!")).toBe("my-company");
  });

  it("trims leading and trailing special characters", () => {
    expect(generateSlug("---Hello World---")).toBe("hello-world");
  });

  it("truncates to 100 characters for very long names", () => {
    const longName = "a".repeat(150);
    const slug = generateSlug(longName);
    expect(slug.length).toBeLessThanOrEqual(100);
  });

  it("throws ValidationError when name produces empty slug", () => {
    expect(() => generateSlug("!!!")).toThrow(
      new ValidationError("Organization name must contain at least one alphanumeric character"),
    );
  });

  it("collapses consecutive special characters into a single hyphen", () => {
    expect(generateSlug("hello   ---   world")).toBe("hello-world");
  });

  it("handles mixed alphanumeric and special characters", () => {
    expect(generateSlug("Org #1 (Test)")).toBe("org-1-test");
  });
});

describe("authService", () => {
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

  it("signup() creates organization and founding admin user when input is valid", async () => {
    const result = await signup({
      organizationName: "Acme Corp",
      name: "Jane Founder",
      email: "jane@acme.test",
      password: "password123",
    });

    expect(result).toEqual<SignupResult>({
      organization: {
        id: expect.any(Number),
        name: "Acme Corp",
        slug: "acme-corp",
      },
      user: {
        id: expect.any(Number),
        name: "Jane Founder",
        email: "jane@acme.test",
        admin: true,
      },
    });

    await expect(
      testDb.one<{ organizationCount: number; userCount: number }>(
        `SELECT
           (SELECT COUNT(*)::int FROM organizations WHERE name = $1) AS "organizationCount",
           (SELECT COUNT(*)::int FROM users WHERE email = $2) AS "userCount"`,
        ["Acme Corp", "jane@acme.test"],
      ),
    ).resolves.toEqual({ organizationCount: 1, userCount: 1 });
  });

  it("signup() hashes the password before storing it", async () => {
    await signup({
      organizationName: "Hash Corp",
      name: "Hash User",
      email: "hash@example.com",
      password: "password123",
    });

    const storedUser = await testDb.one<{ password: string }>(
      "SELECT password FROM users WHERE email = $1",
      ["hash@example.com"],
    );

    expect(storedUser.password).not.toBe("password123");
    await expect(bcrypt.compare("password123", storedUser.password)).resolves.toBe(true);
  });

  it("signup() stores the founding user as admin", async () => {
    await signup({
      organizationName: "Admin Corp",
      name: "Admin User",
      email: "admin@example.com",
      password: "password123",
    });

    await expect(
      testDb.one<{ admin: boolean }>("SELECT admin FROM users WHERE email = $1", [
        "admin@example.com",
      ]),
    ).resolves.toEqual({ admin: true });
  });

  it.each([
    [{ name: "Jane Founder", email: "jane@acme.test", password: "password123" }, "Organization name is required"],
    [{ organizationName: "Acme Corp", email: "jane@acme.test", password: "password123" }, "Name is required"],
    [{ organizationName: "Acme Corp", name: "Jane Founder", password: "password123" }, "Email is required"],
    [{ organizationName: "Acme Corp", name: "Jane Founder", email: "jane@acme.test" }, "Password is required"],
  ])(
    "signup() returns validation error when required fields are missing",
    async (input, message) => {
      await expect(signup(input as never)).rejects.toThrow(new ValidationError(message));
    },
  );

  it("signup() returns duplicate email error when email is already in use", async () => {
    await insertUser({ email: "duplicate@example.com" });

    await expect(
      signup({
        organizationName: "Duplicate Corp",
        name: "Another User",
        email: "duplicate@example.com",
        password: "password123",
      }),
    ).rejects.toThrow(new DuplicateEmailError("Email is already in use"));
  });

  it("signup() generates a valid slug from the organization name", async () => {
    const result = await signup({
      organizationName: "My  Cool  Company!!!",
      name: "Slug User",
      email: "slug@example.com",
      password: "password123",
    });

    expect(result.organization.slug).toBe("my-cool-company");
  });

  it("signup() stores the slug in the database", async () => {
    const result = await signup({
      organizationName: "Stored Slug Org",
      name: "Stored User",
      email: "stored@example.com",
      password: "password123",
    });

    const org = await testDb.one<{ slug: string }>(
      "SELECT slug FROM organizations WHERE id = $1",
      [result.organization.id],
    );

    expect(org.slug).toBe("stored-slug-org");
  });

  it("signup() generates unique slug when duplicate org name exists", async () => {
    const first = await signup({
      organizationName: "Duplicate Org",
      name: "First Owner",
      email: "first-owner@example.com",
      password: "password123",
    });

    const second = await signup({
      organizationName: "Duplicate Org",
      name: "Second Owner",
      email: "second-owner@example.com",
      password: "password123",
    });

    expect(first.organization.slug).toBe("duplicate-org");
    expect(second.organization.slug).not.toBe(first.organization.slug);
    expect(second.organization.slug).toMatch(/^duplicate-org-[a-z0-9]{6}$/);
  });

  it("signup() returns password length error when password is shorter than 8 characters", async () => {
    await expect(
      signup({
        organizationName: "Short Password Corp",
        name: "Short User",
        email: "short@example.com",
        password: "short",
      }),
    ).rejects.toThrow(new PasswordLengthError("Password must be at least 8 characters"));
  });

  it("signin() returns JWT token and user info for valid credentials", async () => {
    const existingUser = await insertUser({
      name: "Valid User",
      email: "valid@example.com",
      password: "password123",
      admin: true,
      organizationName: "Signin Org",
    });

    const result = await signin({
      email: "VALID@example.com",
      password: "password123",
    });

    expect(result.user).toEqual({
      userId: existingUser.id,
      name: "Valid User",
      admin: true,
      organizationName: "Signin Org",
    });
    expect(result.token).toEqual(expect.any(String));
  });

  it("signin() returns invalid credentials for a non-existent email", async () => {
    await expect(
      signin({
        email: "missing@example.com",
        password: "password123",
      }),
    ).rejects.toThrow(new InvalidCredentialsError("Invalid credentials"));
  });

  it("signin() returns invalid credentials for a wrong password", async () => {
    await insertUser({
      email: "wrong-password@example.com",
      password: "password123",
    });

    await expect(
      signin({
        email: "wrong-password@example.com",
        password: "different-password",
      }),
    ).rejects.toThrow(new InvalidCredentialsError("Invalid credentials"));
  });

  it("signin() JWT payload contains userId, organizationId, and admin", async () => {
    const existingUser = await insertUser({
      email: "payload@example.com",
      password: "password123",
      admin: true,
      organizationName: "Payload Org",
    });

    const result = await signin({
      email: "payload@example.com",
      password: "password123",
    });
    const payload = jwt.verify(result.token, JWT_SECRET) as {
      userId: number;
      organizationId: number;
      admin: boolean;
    };

    expect(payload.userId).toBe(existingUser.id);
    expect(payload.organizationId).toBe(existingUser.organizationId);
    expect(payload.admin).toBe(true);
  });
});
