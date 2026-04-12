import { generateRandomCode, generateUniqueCode } from "./ticketCodeService";
import {
  closeTestDatabase,
  testDb,
  truncateTables,
  verifyTestDatabaseConnection,
} from "../data/testHelper";

async function createOrganization(name: string) {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  return testDb.one<{ id: number }>(
    "INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id",
    [name, slug],
  );
}

describe("ticketCodeService", () => {
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

  describe("generateRandomCode", () => {
    it("generates codes matching TK-XXXXXXXX pattern", () => {
      const code = generateRandomCode();
      expect(code).toMatch(/^TK-[A-Z0-9]{8}$/);
    });

    it("generates unique codes across multiple calls", () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        codes.add(generateRandomCode());
      }
      expect(codes.size).toBeGreaterThan(90);
    });
  });

  describe("generateUniqueCode", () => {
    it("generates a unique code that does not exist in the database", async () => {
      const code = await generateUniqueCode();
      expect(code).toMatch(/^TK-[A-Z0-9]{8}$/);
    });

    it("returns a code not already present in tickets table", async () => {
      const org = await createOrganization("Code Test Org");
      const code = await generateUniqueCode();

      const existing = await testDb.oneOrNone(
        "SELECT id FROM tickets WHERE code = $1",
        [code],
      );
      expect(existing).toBeNull();

      await testDb.none(
        `INSERT INTO tickets (code, name, email, phone, description, organization_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [code, "Test", "test@test.com", "123", "desc", org.id],
      );

      const newCode = await generateUniqueCode();
      expect(newCode).not.toBe(code);
    });
  });
});
