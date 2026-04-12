import { Router, type NextFunction, type Request, type Response } from "express";
import {
  adminMiddleware,
  authMiddleware,
  type AuthenticatedRequest,
} from "../data/authMiddleware";
import {
  changeName,
  get,
  NameLengthError,
  NotFoundError,
  ValidationError,
} from "../services/organizationService";

export const organizationRoutes = Router();
organizationRoutes.use(authMiddleware);

function sendErrorResponse(error: unknown, res: Response) {
  if (error instanceof ValidationError) {
    return res.status(400).json({ error: error.message });
  }

  if (error instanceof NameLengthError) {
    return res.status(422).json({ error: error.message });
  }

  if (error instanceof NotFoundError) {
    return res.status(404).json({ error: error.message });
  }

  throw error;
}

organizationRoutes.get("/current", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = (req as AuthenticatedRequest).user;
    const organization = await get(organizationId);

    if (!organization) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }

    res.status(200).json(organization);
  } catch (error) {
    next(error);
  }
});

organizationRoutes.post(
  "/current/change-name",
  adminMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId } = (req as AuthenticatedRequest).user;
      const organization = await changeName(organizationId, req.body);
      res.status(200).json(organization);
    } catch (error) {
      try {
        sendErrorResponse(error, res);
      } catch (unhandledError) {
        next(unhandledError);
      }
    }
  },
);
