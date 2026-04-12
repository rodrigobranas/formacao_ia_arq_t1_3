import { Router, type NextFunction, type Request, type Response } from "express";
import { db } from "../data/database";
import { TicketClassifyExternalError } from "../services/ticketClassifyService";
import { createTicket, getTicketByCode } from "../services/ticketService";
import { ValidationError, NotFoundError, list as listTicketTypes } from "../services/ticketTypeService";

export const publicTicketRoutes = Router();

async function resolveOrganizationBySlug(slug: string): Promise<number> {
  const organization = await db.oneOrNone<{ id: number }>(
    "SELECT id FROM organizations WHERE slug = $1",
    [slug],
  );
  if (!organization) {
    throw new NotFoundError("Organization not found");
  }
  return organization.id;
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

publicTicketRoutes.get(
  "/:orgSlug/ticket-types",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = await resolveOrganizationBySlug(req.params.orgSlug as string);
      const ticketTypes = await listTicketTypes(organizationId);
      res.status(200).json(ticketTypes);
    } catch (error) {
      try {
        sendErrorResponse(error, res);
      } catch (unhandledError) {
        next(unhandledError);
      }
    }
  },
);

publicTicketRoutes.post(
  "/:orgSlug/tickets",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = await resolveOrganizationBySlug(req.params.orgSlug as string);
      const result = await createTicket(req.body, organizationId);
      res.status(201).json({ code: result.code, message: "Ticket created successfully" });
    } catch (error) {
      try {
        sendErrorResponse(error, res);
      } catch (unhandledError) {
        next(unhandledError);
      }
    }
  },
);

publicTicketRoutes.get(
  "/:orgSlug/tickets/:code",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = await resolveOrganizationBySlug(req.params.orgSlug as string);
      const ticket = await getTicketByCode(req.params.code as string, organizationId);
      res.status(200).json(ticket);
    } catch (error) {
      try {
        sendErrorResponse(error, res);
      } catch (unhandledError) {
        next(unhandledError);
      }
    }
  },
);
