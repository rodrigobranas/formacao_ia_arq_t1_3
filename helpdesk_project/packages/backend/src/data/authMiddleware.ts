import type { NextFunction, Request, Response } from "express";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

type AuthenticatedUser = {
  userId: number;
  organizationId: number;
  admin: boolean;
};

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

function getJwtSecret(): string {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwtSecret;
}

function isAuthenticatedUser(payload: unknown): payload is AuthenticatedUser {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  const candidate = payload as Partial<AuthenticatedUser>;

  return (
    Number.isInteger(candidate.userId) &&
    Number.isInteger(candidate.organizationId) &&
    typeof candidate.admin === "boolean"
  );
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authorization = req.headers.authorization;

  if (!authorization) {
    res.status(401).json({ message: "Token not provided" });
    return;
  }

  if (!authorization.startsWith("Bearer ")) {
    res.status(401).json({ message: "Invalid token" });
    return;
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    res.status(401).json({ message: "Invalid token" });
    return;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());

    if (!isAuthenticatedUser(payload)) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }

    (req as AuthenticatedRequest).user = {
      userId: payload.userId,
      organizationId: payload.organizationId,
      admin: payload.admin,
    };
    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      res.status(401).json({ message: "Token expired" });
      return;
    }

    if (error instanceof JsonWebTokenError) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }

    next(error);
  }
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authenticatedRequest = req as Partial<AuthenticatedRequest>;

  if (authenticatedRequest.user?.admin !== true) {
    res.status(403).json({ message: "Admin access required" });
    return;
  }

  next();
}
