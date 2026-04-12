import request from "supertest";

jest.mock("./data/database", () => ({
  db: {
    one: jest.fn(),
  },
}));

import { db } from "./data/database";
import { app } from "./index";

const mockedDb = db as unknown as { one: jest.Mock };

describe("GET /health", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns server and database health", async () => {
    mockedDb.one.mockResolvedValue({ now: "2026-04-06T00:00:00.000Z" });

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      time: "2026-04-06T00:00:00.000Z",
    });
    expect(mockedDb.one).toHaveBeenCalledWith("SELECT NOW()");
  });

  it("returns 500 when the database query fails", async () => {
    mockedDb.one.mockRejectedValue(new Error("db unavailable"));

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ status: "error" });
  });
});
