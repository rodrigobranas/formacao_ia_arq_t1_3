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
