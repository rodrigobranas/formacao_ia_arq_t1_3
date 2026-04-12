import { generateText, Output } from "ai";
import { z } from "zod";
import { getClassificationModel } from "./aiModels";
import { type TicketType } from "../services/ticketTypeService";

export class TicketClassifyExternalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TicketClassifyExternalError";
  }
}

export const SENTIMENT_VALUES = ["positive", "neutral", "negative"] as const;
export type SentimentValue = (typeof SENTIMENT_VALUES)[number];

export interface ClassifyTicketTypeResult {
  ticketTypeId: number;
  ticketTypeName: string;
}

export interface ClassifySentimentResult {
  sentiment: SentimentValue;
}

export interface TicketClassificationInput {
  name: string;
  email: string;
  description: string;
}

function buildUserPrompt(
  ticket: TicketClassificationInput,
  types: TicketType[],
): string {
  const typesBlock = types
    .map((tt) => {
      const desc = tt.description ? ` — ${tt.description}` : "";
      return `- id ${tt.id}: ${tt.name}${desc}`;
    })
    .join("\n");

  return [
    "Choose exactly one ticket_type_id from the list below that best matches the support ticket.",
    "Use only an id that appears in the list.",
    "",
    "Available ticket types:",
    typesBlock,
    "",
    "Ticket:",
    `Name: ${ticket.name}`,
    `Email: ${ticket.email}`,
    `Description:\n${ticket.description}`,
  ].join("\n");
}

function buildSentimentUserPrompt(ticket: TicketClassificationInput): string {
  return [
    "Classify the emotional tone of the customer who opened this support ticket.",
    "Focus on how the customer sounds in the description (frustrated, neutral, appreciative, etc.).",
    "Reply with exactly one sentiment label matching the schema.",
    "",
    "Ticket:",
    `Name: ${ticket.name}`,
    `Email: ${ticket.email}`,
    `Description:\n${ticket.description}`,
  ].join("\n");
}

export async function classifyTicketType(
  ticket: TicketClassificationInput,
  types: TicketType[],
): Promise<ClassifyTicketTypeResult> {
  const allowedIds = types.map((t) => t.id);
  const schema = z.object({
    ticket_type_id: z.number().int(),
  });

  const result = await generateText({
    model: getClassificationModel(),
    output: Output.object({
      schema,
      name: "ticket_type_pick",
      description: "Pick the best ticket_type_id for the ticket",
    }),
    system:
      "You classify support tickets into exactly one organizational ticket type. Reply only with structured JSON matching the schema.",
    prompt: buildUserPrompt(ticket, types),
  });

  const ticketTypeId = result.output?.ticket_type_id;
  if (!ticketTypeId || !allowedIds.includes(ticketTypeId)) {
    throw new TicketClassifyExternalError(
      "Classification returned an unknown ticket type",
    );
  }

  const typeRow = types.find((t) => t.id === ticketTypeId)!;
  return { ticketTypeId, ticketTypeName: typeRow.name };
}

export async function classifySentiment(
  ticket: TicketClassificationInput,
): Promise<ClassifySentimentResult> {
  const result = await generateText({
    model: getClassificationModel(),
    output: Output.choice({
      options: [...SENTIMENT_VALUES],
      name: "ticket_sentiment",
      description: "Customer sentiment for the ticket",
    }),
    system:
      "You classify customer sentiment in support tickets. Reply only with structured JSON matching the schema.",
    prompt: buildSentimentUserPrompt(ticket),
  });

  const sentiment = result.output;
  if (!sentiment || !SENTIMENT_VALUES.includes(sentiment)) {
    throw new TicketClassifyExternalError("Invalid classification result");
  }

  return { sentiment };
}
