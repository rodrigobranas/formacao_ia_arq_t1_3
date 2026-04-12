import { db } from "./database";

export const testDb = db;
export const DEFAULT_ORGANIZATION_NAME = "Default";

export async function verifyTestDatabaseConnection() {
  return testDb.one<{ connected: number }>("SELECT 1 AS connected");
}

export async function ensureDefaultOrganization() {
  const existingOrganization = await testDb.oneOrNone<{ id: number; name: string }>(
    "SELECT id, name FROM organizations WHERE name = $1 LIMIT 1",
    [DEFAULT_ORGANIZATION_NAME],
  );

  if (existingOrganization) {
    return existingOrganization;
  }

  return testDb.one<{ id: number; name: string }>(
    "INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id, name",
    [DEFAULT_ORGANIZATION_NAME, "default"],
  );
}

export async function truncateTables() {
  await testDb.none("TRUNCATE TABLE ticket_attachments, ticket_comments, ticket_assignments, tickets, ticket_types, users, organizations RESTART IDENTITY CASCADE");
  await ensureDefaultOrganization();
}

export async function closeTestDatabase() {
  await testDb.$pool.end();
}
