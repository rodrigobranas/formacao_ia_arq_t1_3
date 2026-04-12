import { Router, type NextFunction, type Request, type Response } from "express";
import {
  authMiddleware,
  type AuthenticatedRequest,
} from "../data/authMiddleware";
import {
  addComment,
  assignTicket,
  closeTicket,
  forwardTicket,
  getTicketById,
  listTickets,
} from "../services/ticketService";
import {
  classifyAndPersistSentiment,
  classifyAndPersistTicketType,
  TicketClassifyExternalError,
} from "../services/ticketClassifyService";
import { ValidationError, NotFoundError } from "../services/ticketTypeService";

export const ticketRoutes = Router();
ticketRoutes.use(authMiddleware);

function parseId(rawId: string): number {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError("Ticket id must be a positive integer");
  }
  return id;
}

function sendErrorResponse(error: unknown, res: Response) {
  if (error instanceof ValidationError) {
    return res.status(400).json({ error: error.message });
  }
  if (error instanceof NotFoundError) {
    return res.status(404).json({ error: error.message });
  }
  if (error instanceof TicketClassifyExternalError) {
    const message = error.message;
    const status = message === "OpenAI API key is not configured" ? 503 : 502;
    return res.status(status).json({ error: message });
  }
  throw error;
}

ticketRoutes.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = (req as AuthenticatedRequest).user;
    const statusParam = req.query.status;
    let statusFilter: string[] | undefined;
    if (statusParam) {
      statusFilter = Array.isArray(statusParam)
        ? (statusParam as string[])
        : [statusParam as string];
    }
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
    const result = await listTickets(organizationId, statusFilter, search, limit, offset);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

ticketRoutes.post(
  "/:id/classify-ticket-type",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId } = (req as AuthenticatedRequest).user;
      const ticketId = parseId(req.params.id as string);
      const result = await classifyAndPersistTicketType(ticketId, organizationId);
      res.status(200).json(result);
    } catch (error) {
      try {
        sendErrorResponse(error, res);
      } catch (unhandledError) {
        next(unhandledError);
      }
    }
  },
);

ticketRoutes.post(
  "/:id/classify-sentiment",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId } = (req as AuthenticatedRequest).user;
      const ticketId = parseId(req.params.id as string);
      const result = await classifyAndPersistSentiment(ticketId, organizationId);
      res.status(200).json(result);
    } catch (error) {
      try {
        sendErrorResponse(error, res);
      } catch (unhandledError) {
        next(unhandledError);
      }
    }
  },
);

ticketRoutes.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = (req as AuthenticatedRequest).user;
    const ticketId = parseId(req.params.id as string);
    const ticket = await getTicketById(ticketId, organizationId);
    res.status(200).json(ticket);
  } catch (error) {
    try {
      sendErrorResponse(error, res);
    } catch (unhandledError) {
      next(unhandledError);
    }
  }
});

ticketRoutes.post("/:id/assign", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId, userId } = (req as AuthenticatedRequest).user;
    const ticketId = parseId(req.params.id as string);
    await assignTicket(ticketId, userId, organizationId);
    res.status(200).json({ message: "Ticket assigned successfully" });
  } catch (error) {
    try {
      sendErrorResponse(error, res);
    } catch (unhandledError) {
      next(unhandledError);
    }
  }
});

ticketRoutes.post("/:id/forward", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId, userId } = (req as AuthenticatedRequest).user;
    const ticketId = parseId(req.params.id as string);
    const { userId: targetUserId } = req.body;
    if (!targetUserId || !Number.isInteger(targetUserId) || targetUserId <= 0) {
      throw new ValidationError("Valid userId is required");
    }
    await forwardTicket(ticketId, targetUserId, userId, organizationId);
    res.status(200).json({ message: "Ticket forwarded successfully" });
  } catch (error) {
    try {
      sendErrorResponse(error, res);
    } catch (unhandledError) {
      next(unhandledError);
    }
  }
});

ticketRoutes.post("/:id/close", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = (req as AuthenticatedRequest).user;
    const ticketId = parseId(req.params.id as string);
    await closeTicket(ticketId, organizationId);
    res.status(200).json({ message: "Ticket closed successfully" });
  } catch (error) {
    try {
      sendErrorResponse(error, res);
    } catch (unhandledError) {
      next(unhandledError);
    }
  }
});

ticketRoutes.post("/:id/comments", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId, userId } = (req as AuthenticatedRequest).user;
    const ticketId = parseId(req.params.id as string);
    const { content, attachments } = req.body;
    const result = await addComment(ticketId, userId, content, organizationId, attachments);
    res.status(201).json(result);
  } catch (error) {
    try {
      sendErrorResponse(error, res);
    } catch (unhandledError) {
      next(unhandledError);
    }
  }
});
