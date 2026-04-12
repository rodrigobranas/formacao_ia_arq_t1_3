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

describe("/api/organizations", () => {
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

  it("GET /api/organizations/current returns 401 without token", async () => {
    const response = await request(app).get("/api/organizations/current");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Token not provided" });
  });

  it("GET /api/organizations/current returns organization with valid token", async () => {
    const organization = await ensureDefaultOrganization();
    const member = await insertUser({
      organizationId: organization.id,
      email: "member@example.com",
      admin: false,
    });

    const response = await request(app)
      .get("/api/organizations/current")
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: member.id, organizationId: organization.id, admin: false })}`,
      );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: organization.id, name: organization.name, slug: "default" });
  });

  it("POST /api/organizations/current/change-name returns 403 with non-admin token", async () => {
    const organization = await ensureDefaultOrganization();
    const member = await insertUser({
      organizationId: organization.id,
      email: "member@example.com",
      admin: false,
    });

    const response = await request(app)
      .post("/api/organizations/current/change-name")
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: member.id, organizationId: organization.id, admin: false })}`,
      )
      .send({ name: "Renamed Org" });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: "Admin access required" });
  });

  it("POST /api/organizations/current/change-name updates name with admin token", async () => {
    const organization = await ensureDefaultOrganization();
    const admin = await insertUser({
      organizationId: organization.id,
      email: "admin@example.com",
      admin: true,
    });

    const response = await request(app)
      .post("/api/organizations/current/change-name")
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: admin.id, organizationId: organization.id, admin: true })}`,
      )
      .send({ name: "  Renamed Org  " });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: organization.id,
      name: "Renamed Org",
      slug: "default",
    });

    await expect(
      testDb.one<{ name: string }>("SELECT name FROM organizations WHERE id = $1", [organization.id]),
    ).resolves.toEqual({ name: "Renamed Org" });
  });

  it("POST /api/organizations/current/change-name returns 400 for empty name", async () => {
    const organization = await ensureDefaultOrganization();
    const admin = await insertUser({
      organizationId: organization.id,
      email: "admin@example.com",
      admin: true,
    });

    const response = await request(app)
      .post("/api/organizations/current/change-name")
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: admin.id, organizationId: organization.id, admin: true })}`,
      )
      .send({ name: "   " });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Name is required" });
  });

  it("POST /api/organizations/current/change-name returns 422 for name longer than 100 characters", async () => {
    const organization = await ensureDefaultOrganization();
    const admin = await insertUser({
      organizationId: organization.id,
      email: "admin@example.com",
      admin: true,
    });

    const response = await request(app)
      .post("/api/organizations/current/change-name")
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: admin.id, organizationId: organization.id, admin: true })}`,
      )
      .send({ name: "a".repeat(101) });

    expect(response.status).toBe(422);
    expect(response.body).toEqual({ error: "Name must be at most 100 characters" });
  });

  it("GET /api/organizations/current returns 404 when the organization no longer exists", async () => {
    const organization = await ensureDefaultOrganization();
    const member = await insertUser({
      organizationId: organization.id,
      email: "member@example.com",
      admin: false,
    });

    const response = await request(app)
      .get("/api/organizations/current")
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: member.id, organizationId: 9999, admin: false })}`,
      );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Organization not found" });
  });
});
