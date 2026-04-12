import { tool } from "ai";
import { z } from "zod";
import { listTickets, getTicketById } from "../services/ticketService";
import { getDashboardMetrics } from "../services/dashboardService";

const listTicketsInputSchema = z.object({
  status: z
    .array(z.string())
    .optional()
    .describe("Filter by ticket status (e.g. new, assigned, closed)."),
  search: z
    .string()
    .optional()
    .describe("Search in name, email, phone, description."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Page size (default 50)."),
  offset: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Skip this many rows for pagination."),
});

const getTicketInputSchema = z.object({
  ticketId: z
    .number()
    .int()
    .positive()
    .describe("Ticket id (number from listTickets)."),
});

const getDashboardMetricsInputSchema = z.object({
  period: z
    .enum(["7d", "30d", "90d"])
    .optional()
    .describe("Defaults to backend default when omitted."),
});

export function createHelpdeskOperatorTools({
  organizationId,
}: {
  organizationId: number;
}) {
  return {
    listTickets: tool({
      description:
        "List tickets for the organization. Supports filtering by status, optional text search, limit and offset for pagination. Response includes data (rows) and total count.",
      inputSchema: listTicketsInputSchema,
      execute: async (input) => {
        const limit = input.limit ?? 50;
        return listTickets(
          organizationId,
          input.status,
          input.search,
          limit,
          input.offset,
        );
      },
    }),
    getTicket: tool({
      description:
        "Get full ticket detail by numeric id: status, description, comments, attachments metadata, assignment history.",
      inputSchema: getTicketInputSchema,
      execute: async ({ ticketId }) => getTicketById(ticketId, organizationId),
    }),
    getDashboardMetrics: tool({
      description:
        "Organization dashboard metrics and trends for a period (7d, 30d, or 90d). Use for volume, KPIs, trends.",
      inputSchema: getDashboardMetricsInputSchema,
      execute: async (input) =>
        getDashboardMetrics(organizationId, input.period),
    }),
  };
}
