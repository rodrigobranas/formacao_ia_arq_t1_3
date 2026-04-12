import {
  classifySentiment,
  classifyTicketType,
  type ClassifySentimentResult,
  type ClassifyTicketTypeResult,
  TicketClassifyExternalError,
  type TicketClassificationInput,
} from "../agents/classifyService";
import { db } from "../data/database";
import {
  list as listTicketTypes,
  NotFoundError,
  ValidationError,
} from "./ticketTypeService";

export {
  classifySentiment,
  classifyTicketType,
  SENTIMENT_VALUES,
  TicketClassifyExternalError,
  type ClassifySentimentResult,
  type ClassifyTicketTypeResult,
  type SentimentValue,
  type TicketClassificationInput,
} from "../agents/classifyService";

export async function classifyAndPersistTicketType(
  ticketId: number,
  organizationId: number,
): Promise<ClassifyTicketTypeResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new TicketClassifyExternalError("OpenAI API key is not configured");
  }

  const ticket = await db.oneOrNone<TicketClassificationInput>(
    `SELECT name, email, description
     FROM tickets
     WHERE id = $1 AND organization_id = $2`,
    [ticketId, organizationId],
  );

  if (!ticket) {
    throw new NotFoundError("Ticket not found");
  }

  const types = await listTicketTypes(organizationId);
  if (types.length === 0) {
    throw new ValidationError("No ticket types defined for this organization");
  }

  let classification: ClassifyTicketTypeResult;
  try {
    classification = await classifyTicketType(ticket, types);
  } catch {
    throw new TicketClassifyExternalError("Classification request failed");
  }

  await db.none(
    `UPDATE tickets SET ticket_type_id = $1, updated_at = NOW()
     WHERE id = $2 AND organization_id = $3`,
    [classification.ticketTypeId, ticketId, organizationId],
  );

  return classification;
}

export async function classifyAndPersistSentiment(
  ticketId: number,
  organizationId: number,
): Promise<ClassifySentimentResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new TicketClassifyExternalError("OpenAI API key is not configured");
  }

  const ticket = await db.oneOrNone<TicketClassificationInput>(
    `SELECT name, email, description
     FROM tickets
     WHERE id = $1 AND organization_id = $2`,
    [ticketId, organizationId],
  );

  if (!ticket) {
    throw new NotFoundError("Ticket not found");
  }

  let classification: ClassifySentimentResult;
  try {
    classification = await classifySentiment(ticket);
  } catch {
    throw new TicketClassifyExternalError("Classification request failed");
  }

  await db.none(
    `UPDATE tickets SET sentiment = $1, updated_at = NOW()
     WHERE id = $2 AND organization_id = $3`,
    [classification.sentiment, ticketId, organizationId],
  );

  return classification;
}
