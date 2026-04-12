import bcrypt from "bcrypt";
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

const JWT_SECRET = "test-secret";

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
      params.organizationId,
    ],
  );
}

function signToken(payload: { userId: number; organizationId: number; admin: boolean }) {
  return jwt.sign(payload, JWT_SECRET);
}

describe("/api/users", () => {
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

  it("GET /api/users returns 401 without token", async () => {
    const response = await request(app).get("/api/users");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Token not provided" });
  });

  it("GET /api/users returns 403 with non-admin token", async () => {
    const organization = await ensureDefaultOrganization();
    const member = await insertUser({
      organizationId: organization.id,
      email: "member@example.com",
      admin: false,
    });

    const response = await request(app)
      .get("/api/users")
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: member.id, organizationId: organization.id, admin: false })}`,
      );

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: "Admin access required" });
  });

  it("GET /api/users returns user list with admin token and no password in response", async () => {
    const organization = await ensureDefaultOrganization();
    const admin = await insertUser({
      organizationId: organization.id,
      name: "Admin User",
      email: "admin@example.com",
      admin: true,
    });
    await insertUser({
      organizationId: organization.id,
      name: "Regular User",
      email: "user@example.com",
      admin: false,
    });
    const otherOrganization = await createOrganization("Other Org");
    await insertUser({
      organizationId: otherOrganization.id,
      name: "Other User",
      email: "other@example.com",
      admin: false,
    });

    const response = await request(app)
      .get("/api/users")
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: admin.id, organizationId: organization.id, admin: true })}`,
      );

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: admin.id,
        name: "Admin User",
        email: "admin@example.com",
        admin: true,
      },
      {
        id: expect.any(Number),
        name: "Regular User",
        email: "user@example.com",
        admin: false,
      },
    ]);
    expect(JSON.stringify(response.body)).not.toContain("password");
  });

  it("POST /api/users creates user with admin token", async () => {
    const organization = await ensureDefaultOrganization();
    const admin = await insertUser({
      organizationId: organization.id,
      email: "admin@example.com",
      admin: true,
    });

    const response = await request(app)
      .post("/api/users")
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: admin.id, organizationId: organization.id, admin: true })}`,
      )
      .send({
        name: "New Member",
        email: "member@example.com",
        password: "password123",
        admin: false,
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: expect.any(Number),
      name: "New Member",
      email: "member@example.com",
      admin: false,
    });

    const storedUser = await testDb.one<{ organizationId: number; password: string }>(
      `SELECT organization_id AS "organizationId", password
       FROM users
       WHERE email = $1`,
      ["member@example.com"],
    );

    expect(storedUser.organizationId).toBe(organization.id);
    expect(storedUser.password).not.toBe("password123");
    await expect(bcrypt.compare("password123", storedUser.password)).resolves.toBe(true);
  });

  it("POST /api/users returns 422 for duplicate email", async () => {
    const organization = await ensureDefaultOrganization();
    const admin = await insertUser({
      organizationId: organization.id,
      email: "admin@example.com",
      admin: true,
    });
    await insertUser({
      organizationId: organization.id,
      email: "duplicate@example.com",
    });

    const response = await request(app)
      .post("/api/users")
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: admin.id, organizationId: organization.id, admin: true })}`,
      )
      .send({
        name: "Duplicate User",
        email: "duplicate@example.com",
        password: "password123",
        admin: false,
      });

    expect(response.status).toBe(422);
    expect(response.body).toEqual({ error: "Email is already in use" });
  });

  it("DELETE /api/users/:id returns 403 when admin deletes self", async () => {
    const organization = await ensureDefaultOrganization();
    const admin = await insertUser({
      organizationId: organization.id,
      email: "admin@example.com",
      admin: true,
    });

    const response = await request(app)
      .delete(`/api/users/${admin.id}`)
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: admin.id, organizationId: organization.id, admin: true })}`,
      );

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Admin cannot delete themselves" });
  });

  it("DELETE /api/users/:userId returns 404 for user in different organization", async () => {
    const organization = await ensureDefaultOrganization();
    const admin = await insertUser({
      organizationId: organization.id,
      email: "admin@example.com",
      admin: true,
    });
    const otherOrganization = await createOrganization("Other Org");
    const otherUser = await insertUser({
      organizationId: otherOrganization.id,
      email: "other@example.com",
    });

    const response = await request(app)
      .delete(`/api/users/${otherUser.id}`)
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: admin.id, organizationId: organization.id, admin: true })}`,
      );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "User not found" });
  });
});
