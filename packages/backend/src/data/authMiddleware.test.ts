import express, { type NextFunction, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { adminMiddleware, authMiddleware, type AuthenticatedRequest } from "./authMiddleware";

const JWT_SECRET = "test-secret";

function createResponseDouble() {
  const res = {} as Response & {
    status: jest.MockedFunction<(code: number) => Response>;
    json: jest.MockedFunction<(body: unknown) => Response>;
  };

  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);

  return res;
}

function signToken(payload: AuthenticatedRequest["user"], options?: jwt.SignOptions) {
  return jwt.sign(payload, JWT_SECRET, options);
}

describe("authMiddleware", () => {
  const originalJwtSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalJwtSecret;
  });

  it("attaches user context when a valid token is provided", () => {
    const req = {
      headers: {
        authorization: `Bearer ${signToken({ userId: 1, organizationId: 10, admin: true })}`,
      },
    } as Request;
    const res = createResponseDouble();
    const next = jest.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect((req as AuthenticatedRequest).user).toEqual({
      userId: 1,
      organizationId: 10,
      admin: true,
    });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 401 when no Authorization header is present", () => {
    const req = { headers: {} } as Request;
    const res = createResponseDouble();
    const next = jest.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token not provided" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when token format is invalid", () => {
    const req = { headers: { authorization: "Token invalid-format" } } as Request;
    const res = createResponseDouble();
    const next = jest.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when token signature is invalid", () => {
    const req = {
      headers: {
        authorization: `Bearer ${jwt.sign({ userId: 1, organizationId: 10, admin: true }, "wrong-secret")}`,
      },
    } as Request;
    const res = createResponseDouble();
    const next = jest.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when token is expired", () => {
    const req = {
      headers: {
        authorization: `Bearer ${signToken(
          { userId: 1, organizationId: 10, admin: true },
          { expiresIn: -1 },
        )}`,
      },
    } as Request;
    const res = createResponseDouble();
    const next = jest.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token expired" });
    expect(next).not.toHaveBeenCalled();
  });
});

describe("adminMiddleware", () => {
  it("calls next() when req.user.admin is true", () => {
    const req = {
      user: { userId: 1, organizationId: 10, admin: true },
    } as AuthenticatedRequest;
    const res = createResponseDouble();
    const next = jest.fn() as NextFunction;

    adminMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 403 when req.user.admin is false", () => {
    const req = {
      user: { userId: 1, organizationId: 10, admin: false },
    } as AuthenticatedRequest;
    const res = createResponseDouble();
    const next = jest.fn() as NextFunction;

    adminMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Admin access required" });
    expect(next).not.toHaveBeenCalled();
  });
});

describe("auth middleware integration", () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  const app = express();

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    app.use(express.json());
    app.get("/protected", authMiddleware, (req: Request, res: Response) => {
      res.status(200).json((req as AuthenticatedRequest).user);
    });
    app.get("/admin", authMiddleware, adminMiddleware, (_req: Request, res: Response) => {
      res.status(200).json({ ok: true });
    });
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalJwtSecret;
  });

  it("returns 401 without token on a protected endpoint", async () => {
    const response = await request(app).get("/protected");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Token not provided" });
  });

  it("succeeds with a valid token on a protected endpoint", async () => {
    const response = await request(app)
      .get("/protected")
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: 7, organizationId: 3, admin: false })}`,
      );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      userId: 7,
      organizationId: 3,
      admin: false,
    });
  });

  it("returns 403 on an admin endpoint with a valid non-admin token", async () => {
    const response = await request(app)
      .get("/admin")
      .set(
        "Authorization",
        `Bearer ${signToken({ userId: 7, organizationId: 3, admin: false })}`,
      );

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: "Admin access required" });
  });
});
