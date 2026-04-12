import { Router, type NextFunction, type Request, type Response } from "express";
import {
  adminMiddleware,
  authMiddleware,
  type AuthenticatedRequest,
} from "../data/authMiddleware";
import {
  create,
  DuplicateEmailError,
  ForbiddenError,
  list,
  NotFoundError,
  remove,
  PasswordLengthError,
  ValidationError,
} from "../services/userService";

export const userRoutes = Router();
userRoutes.use(authMiddleware);
userRoutes.use(adminMiddleware);

function parseId(rawId: string): number {
  const userId = Number(rawId);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new ValidationError("User id must be a positive integer");
  }

  return userId;
}

function getUserIdParam(req: Request): number {
  const rawUserId = req.params.userId;

  if (typeof rawUserId !== "string") {
    throw new ValidationError("User id must be a positive integer");
  }

  return parseId(rawUserId);
}

function sendErrorResponse(error: unknown, res: Response) {
  if (error instanceof ValidationError) {
    return res.status(400).json({ error: error.message });
  }

  if (
    error instanceof DuplicateEmailError ||
    error instanceof PasswordLengthError
  ) {
    return res.status(422).json({ error: error.message });
  }

  if (error instanceof ForbiddenError) {
    return res.status(403).json({ error: error.message });
  }

  if (error instanceof NotFoundError) {
    return res.status(404).json({ error: error.message });
  }

  throw error;
}

userRoutes.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = (req as AuthenticatedRequest).user;
    const users = await list(organizationId);
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
});

userRoutes.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = (req as AuthenticatedRequest).user;
    const user = await create(req.body, organizationId);
    res.status(200).json(user);
  } catch (error) {
    try {
      sendErrorResponse(error, res);
    } catch (unhandledError) {
      next(unhandledError);
    }
  }
});

userRoutes.delete("/:userId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId, userId: authenticatedUserId } = (req as AuthenticatedRequest).user;
    await remove(getUserIdParam(req), organizationId, authenticatedUserId);
    res.status(200).send();
  } catch (error) {
    try {
      sendErrorResponse(error, res);
    } catch (unhandledError) {
      next(unhandledError);
    }
  }
});
