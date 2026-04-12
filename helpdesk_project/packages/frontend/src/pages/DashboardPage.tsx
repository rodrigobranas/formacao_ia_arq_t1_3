import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import KpiCard from "@/components/ui/KpiCard";
import type {
  DashboardMetrics,
  TrendDataPoint,
  ResolutionTrendPoint,
  TicketsByTypePoint,
} from "@/types/types";
import {
  Ticket,
  UserX,
  Clock,
  CheckCircle,
  Timer,
  PlusCircle,
} from "lucide-react";

const AUTO_REFRESH_INTERVAL = 30000;

type Period = "7d" | "30d" | "90d";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
];

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};

const formatAvgResolution = (hours: number | null): string => {
  if (hours === null) return "N/A";
  const totalMinutes = hours * 60;
  return formatDuration(totalMinutes);
};

const formatShortDate = (dateString: string): string => {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const formatResolutionHours = (value: number): string => `${value}h`;

interface TrendsData {
  volume: TrendDataPoint[];
  resolutionTime: ResolutionTrendPoint[];
  byType: TicketsByTypePoint[];
}

function DashboardPage() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [period, setPeriod] = useState<Period>("30d");
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [isTrendsLoading, setIsTrendsLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard/metrics");
      if (!response.ok) {
        throw new Error(t("dashboard.loadError"));
      }
      const data = (await response.json()) as DashboardMetrics;
      setMetrics(data);
      setLastRefreshed(new Date());
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : t("dashboard.loadError"),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTrends = useCallback(async (selectedPeriod: Period) => {
    setIsTrendsLoading(true);
    try {
      const response = await fetch(
        `/api/dashboard/metrics?period=${selectedPeriod}`,
      );
      if (!response.ok) {
        setTrends(null);
        return;
      }
      const data = (await response.json()) as DashboardMetrics;
      setTrends(data.trends ?? null);
    } catch {
      setTrends(null);
    } finally {
      setIsTrendsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMetrics();
    const intervalId = setInterval(() => {
      void fetchMetrics();
    }, AUTO_REFRESH_INTERVAL);
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchMetrics]);

  useEffect(() => {
    void fetchTrends(period);
  }, [period, fetchTrends]);

  const handleManualRefresh = () => {
    void fetchMetrics();
    void fetchTrends(period);
  };

  if (isLoading) {
    return (
      <main className="px-6 py-10 animate-fade-in">
        <section className="mx-auto flex max-w-6xl flex-col gap-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" data-testid="skeleton" />
            <Skeleton className="h-4 w-96" data-testid="skeleton" />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" data-testid="skeleton" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" data-testid="skeleton" />
        </section>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="px-6 py-10 animate-fade-in">
        <section className="mx-auto flex max-w-6xl flex-col gap-8">
          <div
            className="flex items-center gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {loadError}
          </div>
        </section>
      </main>
    );
  }

  if (!metrics) return null;

  const oldestAge = metrics.kpis.oldestWaitingTicket
    ? formatDuration(metrics.kpis.oldestWaitingTicket.ageMinutes)
    : "None";

  const trendsEmpty =
    !trends ||
    (trends.volume.length === 0 &&
      trends.resolutionTime.length === 0 &&
      trends.byType.length === 0);

  return (
    <main className="px-6 py-10 animate-fade-in">
      <section className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1.5">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              {t("dashboard.title")}
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              {t("dashboard.description")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastRefreshed && (
              <span className="text-xs text-muted-foreground" data-testid="last-refreshed">
                {t("common.lastRefreshed")}{" "}
                {lastRefreshed.toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            )}
            <Button size="sm" variant="outline" onClick={handleManualRefresh}>
              {t("common.refresh")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <KpiCard
            label={t("dashboard.openTickets")}
            value={metrics.kpis.openTickets}
            icon={<Ticket className="h-5 w-5" />}
          />
          <KpiCard
            label={t("dashboard.unassignedTickets")}
            value={metrics.kpis.unassignedTickets}
            icon={<UserX className="h-5 w-5" />}
          />
          <KpiCard
            label={t("dashboard.oldestWaitingTicket")}
            value={oldestAge}
            icon={<Clock className="h-5 w-5" />}
          />
          <KpiCard
            label={t("dashboard.closedToday")}
            value={metrics.kpis.closedToday}
            icon={<CheckCircle className="h-5 w-5" />}
          />
          <KpiCard
            label={t("dashboard.avgResolutionTime")}
            value={formatAvgResolution(metrics.kpis.avgResolutionTimeHours)}
            icon={<Timer className="h-5 w-5" />}
          />
          <KpiCard
            label={t("dashboard.newToday")}
            value={metrics.kpis.newToday}
            icon={<PlusCircle className="h-5 w-5" />}
          />
        </div>

        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold tracking-tight">
            {t("dashboard.trends")}
          </h3>
          <div className="flex gap-2" role="group" aria-label="Time range selector">
            {PERIOD_OPTIONS.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={period === option.value ? "default" : "outline"}
                onClick={() => setPeriod(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {isTrendsLoading && (
          <div className="flex flex-col gap-6" data-testid="trends-loading">
            <Skeleton className="h-64 rounded-xl" data-testid="skeleton" />
            <Skeleton className="h-64 rounded-xl" data-testid="skeleton" />
            <Skeleton className="h-64 rounded-xl" data-testid="skeleton" />
          </div>
        )}

        {!isTrendsLoading && trendsEmpty && (
          <div
            className="flex items-center justify-center rounded-xl border border-border/60 px-4 py-12 shadow-soft"
            data-testid="trends-empty"
          >
            <p className="text-sm text-muted-foreground">
              {t("dashboard.noTrendData")}
            </p>
          </div>
        )}

        {!isTrendsLoading && !trendsEmpty && (
          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-border/60 p-6 shadow-soft">
              <h4 className="mb-4 font-display text-base font-semibold tracking-tight">
                {t("dashboard.ticketVolume")}
              </h4>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trends.volume}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatShortDate} />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(label) => formatShortDate(String(label))}
                    formatter={(value) => [value, t("dashboard.ticketsLabel")]}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-border/60 p-6 shadow-soft">
              <h4 className="mb-4 font-display text-base font-semibold tracking-tight">
                {t("dashboard.resolutionTimeTrend")}
              </h4>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trends.resolutionTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatShortDate} />
                  <YAxis tickFormatter={formatResolutionHours} />
                  <Tooltip
                    labelFormatter={(label) => formatShortDate(String(label))}
                    formatter={(value) => [
                      formatResolutionHours(Number(value)),
                      t("dashboard.avgResolution"),
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgHours"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-border/60 p-6 shadow-soft">
              <h4 className="mb-4 font-display text-base font-semibold tracking-tight">
                {t("dashboard.ticketsByType")}
              </h4>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={trends.byType} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="typeName" type="category" width={120} />
                  <Tooltip
                    formatter={(value) => [value, t("dashboard.ticketsLabel")]}
                  />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default DashboardPage;
