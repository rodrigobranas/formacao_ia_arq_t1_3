export interface TicketType {
  id: number;
  name: string;
  description: string | null;
}

export interface User {
  id: number;
  name: string;
  email: string;
  admin: boolean;
}

export interface AuthUser {
  userId: number;
  organizationId: number;
  admin: boolean;
  name: string;
  organizationName: string;
}

export interface AttachmentInput {
  filename: string;
  contentType: string;
  content: string;
}

export interface CreatePublicTicketInput {
  name: string;
  email: string;
  phone: string;
  description: string;
  ticketTypeId?: number;
  attachments?: AttachmentInput[];
}

export interface CreatePublicTicketResponse {
  code: string;
  message: string;
}

export interface PublicTicketStatus {
  code: string;
  status: "new" | "assigned" | "closed";
  createdAt: string;
  updatedAt: string;
}

export type TicketSentiment = "positive" | "neutral" | "negative";

export interface TicketSummary {
  id: number;
  code: string;
  status: "new" | "assigned" | "closed";
  name: string;
  ticketTypeName: string | null;
  sentiment: TicketSentiment | null;
  assignedToName: string | null;
  createdAt: string;
}

export interface TicketAttachment {
  id: number;
  filename: string;
  contentType: string;
  content: string;
  createdAt: string;
}

export interface TicketComment {
  id: number;
  userName: string;
  content: string;
  attachments: TicketAttachment[];
  createdAt: string;
}

export interface TicketAssignment {
  assignedToName: string;
  assignedByName: string;
  createdAt: string;
}

export interface TicketDetail {
  id: number;
  code: string;
  status: "new" | "assigned" | "closed";
  name: string;
  email: string;
  phone: string;
  description: string;
  ticketTypeName: string | null;
  sentiment: TicketSentiment | null;
  assignedToName: string | null;
  createdAt: string;
  updatedAt: string;
  comments: TicketComment[];
  attachments: TicketAttachment[];
  assignments: TicketAssignment[];
}

export interface DashboardKpis {
  openTickets: number;
  unassignedTickets: number;
  oldestWaitingTicket: OldestTicket | null;
  closedToday: number;
  avgResolutionTimeHours: number | null;
  newToday: number;
}

export interface OldestTicket {
  id: number;
  code: string;
  name: string;
  createdAt: string;
  ageMinutes: number;
}

export interface QueueItem {
  id: number;
  code: string;
  name: string;
  status: string;
  assignedToName: string | null;
  ticketTypeName: string | null;
  createdAt: string;
  ageMinutes: number;
}

export interface TrendDataPoint {
  date: string;
  count: number;
}

export interface ResolutionTrendPoint {
  date: string;
  avgHours: number;
}

export interface TicketsByTypePoint {
  typeName: string;
  count: number;
}

export interface DashboardMetrics {
  kpis: DashboardKpis;
  queue: QueueItem[];
  trends?: {
    volume: TrendDataPoint[];
    resolutionTime: ResolutionTrendPoint[];
    byType: TicketsByTypePoint[];
  };
  refreshedAt: string;
}
