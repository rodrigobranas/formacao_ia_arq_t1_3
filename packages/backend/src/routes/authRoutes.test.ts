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

describe("/api/signup and /api/signin", () => {
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

  it("POST /api/signup returns 200 and creates organization and user", async () => {
    const response = await request(app).post("/api/signup").send({
      organizationName: "Acme Corp",
      name: "Jane Founder",
      email: "jane@acme.test",
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
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

  it("POST /api/signup returns 422 when email is already in use", async () => {
    await request(app).post("/api/signup").send({
      organizationName: "First Org",
      name: "First User",
      email: "duplicate@example.com",
      password: "password123",
    });

    const response = await request(app).post("/api/signup").send({
      organizationName: "Second Org",
      name: "Second User",
      email: "duplicate@example.com",
      password: "password123",
    });

    expect(response.status).toBe(422);
    expect(response.body).toEqual({ error: "Email is already in use" });
  });

  it("POST /api/signup generates unique slug when duplicate org name is used", async () => {
    const first = await request(app).post("/api/signup").send({
      organizationName: "Same Name Org",
      name: "First Owner",
      email: "first@example.com",
      password: "password123",
    });

    const second = await request(app).post("/api/signup").send({
      organizationName: "Same Name Org",
      name: "Second Owner",
      email: "second@example.com",
      password: "password123",
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.body.organization.slug).toBe("same-name-org");
    expect(second.body.organization.slug).not.toBe(first.body.organization.slug);
    expect(second.body.organization.slug).toMatch(/^same-name-org-[a-z0-9]{6}$/);
  });

  it("POST /api/signup returns 400 when required fields are missing", async () => {
    const response = await request(app).post("/api/signup").send({
      organizationName: "Missing Email Org",
      name: "Missing Email User",
      password: "password123",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Email is required" });
  });

  it("POST /api/signin returns 200 with token for valid credentials", async () => {
    await request(app).post("/api/signup").send({
      organizationName: "Signin Org",
      name: "Signin User",
      email: "signin@example.com",
      password: "password123",
    });

    const response = await request(app).post("/api/signin").send({
      email: "signin@example.com",
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      token: expect.any(String),
      user: {
        userId: expect.any(Number),
        name: "Signin User",
        admin: true,
        organizationName: "Signin Org",
      },
    });
  });

  it("POST /api/signin returns 401 for invalid credentials", async () => {
    await request(app).post("/api/signup").send({
      organizationName: "Invalid Org",
      name: "Invalid User",
      email: "invalid@example.com",
      password: "password123",
    });

    const response = await request(app).post("/api/signin").send({
      email: "invalid@example.com",
      password: "wrong-password",
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Invalid credentials" });
  });

  it("signup and signin flow returns a valid token for the created user", async () => {
    const signupResponse = await request(app).post("/api/signup").send({
      organizationName: "Flow Org",
      name: "Flow User",
      email: "flow@example.com",
      password: "password123",
    });

    const signinResponse = await request(app).post("/api/signin").send({
      email: "flow@example.com",
      password: "password123",
    });

    expect(signupResponse.status).toBe(200);
    expect(signinResponse.status).toBe(200);

    const payload = jwt.verify(signinResponse.body.token, JWT_SECRET) as {
      userId: number;
      organizationId: number;
      admin: boolean;
    };
    const storedUser = await testDb.one<{ id: number; organizationId: number; admin: boolean }>(
      `SELECT
         id,
         organization_id AS "organizationId",
         admin
       FROM users
       WHERE email = $1`,
      ["flow@example.com"],
    );

    expect(payload).toMatchObject({
      userId: storedUser.id,
      organizationId: storedUser.organizationId,
      admin: storedUser.admin,
    });
  });
});
