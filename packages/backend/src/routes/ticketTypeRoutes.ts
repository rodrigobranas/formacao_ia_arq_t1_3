import { Router, type NextFunction, type Request, type Response } from "express";
import {
  adminMiddleware,
  authMiddleware,
  type AuthenticatedRequest,
} from "../data/authMiddleware";
import {
  ConflictError,
  create,
  InUseError,
  list,
  NotFoundError,
  remove,
  update,
  ValidationError,
} from "../services/ticketTypeService";

export const ticketTypeRoutes = Router();
ticketTypeRoutes.use(authMiddleware);

function parseId(rawId: string): number {
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError("Ticket type id must be a positive integer");
  }

  return id;
}

function getIdParam(req: Request): number {
  const rawId = req.params.id;

  if (typeof rawId !== "string") {
    throw new ValidationError("Ticket type id must be a positive integer");
  }

  return parseId(rawId);
}

function sendErrorResponse(error: unknown, res: Response) {
  if (
    error instanceof ValidationError ||
    error instanceof ConflictError
  ) {
    return res.status(400).json({ error: error.message });
  }

  if (error instanceof NotFoundError) {
    return res.status(404).json({ error: error.message });
  }

  if (error instanceof InUseError) {
    return res.status(409).json({ error: error.message });
  }

  throw error;
}

ticketTypeRoutes.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = (req as AuthenticatedRequest).user;
    const ticketTypes = await list(organizationId);
    res.status(200).json(ticketTypes);
  } catch (error) {
    next(error);
  }
});

ticketTypeRoutes.post(
  "/",
  adminMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId } = (req as AuthenticatedRequest).user;
      const ticketType = await create(req.body, organizationId);
      res.status(201).json(ticketType);
    } catch (error) {
      try {
        sendErrorResponse(error, res);
      } catch (unhandledError) {
        next(unhandledError);
      }
    }
  },
);

ticketTypeRoutes.put(
  "/:id",
  adminMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId } = (req as AuthenticatedRequest).user;
      const ticketType = await update(getIdParam(req), req.body, organizationId);
      res.status(200).json(ticketType);
    } catch (error) {
      try {
        sendErrorResponse(error, res);
      } catch (unhandledError) {
        next(unhandledError);
      }
    }
  },
);

ticketTypeRoutes.delete(
  "/:id",
  adminMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId } = (req as AuthenticatedRequest).user;
      await remove(getIdParam(req), organizationId);
      res.status(204).send();
    } catch (error) {
      try {
        sendErrorResponse(error, res);
      } catch (unhandledError) {
        next(unhandledError);
      }
    }
  },
);
