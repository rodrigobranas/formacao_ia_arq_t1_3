import { testDb, verifyTestDatabaseConnection, closeTestDatabase } from "./testHelper";

beforeAll(async () => {
  await verifyTestDatabaseConnection();
});

afterAll(async () => {
  await closeTestDatabase();
});

const findIndex = async (indexName: string) => {
  return testDb.oneOrNone<{ indexname: string }>(
    "SELECT indexname FROM pg_indexes WHERE tablename = 'tickets' AND indexname = $1",
    [indexName],
  );
};

describe("Dashboard indexes on tickets table", () => {
  it("should have idx_tickets_org_status index", async () => {
    const result = await findIndex("idx_tickets_org_status");
    expect(result).not.toBeNull();
    expect(result!.indexname).toBe("idx_tickets_org_status");
  });

  it("should have idx_tickets_org_created index", async () => {
    const result = await findIndex("idx_tickets_org_created");
    expect(result).not.toBeNull();
    expect(result!.indexname).toBe("idx_tickets_org_created");
  });

  it("should have idx_tickets_org_status_created index", async () => {
    const result = await findIndex("idx_tickets_org_status_created");
    expect(result).not.toBeNull();
    expect(result!.indexname).toBe("idx_tickets_org_status_created");
  });
});
