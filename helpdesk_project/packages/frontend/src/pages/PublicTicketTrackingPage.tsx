import { type ChangeEvent, type FormEvent, useState } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PublicTicketStatus } from "@/types/types";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

function PublicTicketTrackingPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [ticket, setTicket] = useState<PublicTicketStatus | null>(null);

  const statusLabels: Record<PublicTicketStatus["status"], string> = {
    new: t("publicTicketTracking.statusNew"),
    assigned: t("publicTicketTracking.statusAssigned"),
    closed: t("publicTicketTracking.statusClosed"),
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedCode = code.trim();
    if (trimmedCode.length === 0) {
      setError(t("publicTicketTracking.emptyCodeError"));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setTicket(null);

      const response = await fetch(
        `/api/public/${orgSlug}/tickets/${encodeURIComponent(trimmedCode)}`,
      );

      if (response.status === 404) {
        setError(t("publicTicketTracking.notFoundError"));
        return;
      }

      if (!response.ok) {
        setError(t("common.somethingWentWrong"));
        return;
      }

      const data = (await response.json()) as PublicTicketStatus;
      setTicket(data);
    } catch {
      setError(t("common.somethingWentWrong"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(32,156,255,0.12),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,1))] px-6 py-16 text-foreground dark:bg-[radial-gradient(circle_at_top,rgba(32,156,255,0.08),transparent_35%),linear-gradient(180deg,hsl(215_25%_9%),hsl(215_25%_9%))]">
      <section className="mx-auto max-w-lg">
        <div className="rounded-[28px] border border-border/70 bg-card/95 p-8 shadow-soft sm:p-10">
          <div className="mb-8 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              {t("publicTicketTracking.badge")}
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {t("publicTicketTracking.title")}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("publicTicketTracking.subtitle")}
            </p>
          </div>

          <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="ticketCode">
                {t("publicTicketTracking.ticketCodeLabel")}
              </label>
              <Input
                id="ticketCode"
                name="ticketCode"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  setCode(event.target.value);
                  setError(null);
                }}
                placeholder="TK-XXXXXXXX"
                value={code}
              />
            </div>

            {error ? (
              <div
                className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                role="alert"
              >
                {error}
              </div>
            ) : null}

            <Button className="w-full" disabled={isLoading} type="submit">
              {isLoading ? t("common.searching") : t("common.search")}
            </Button>
          </form>

          {ticket ? (
            <div className="mt-8 space-y-4" data-testid="ticket-status">
              <h2 className="font-display text-xl font-bold tracking-tight">
                {t("publicTicketTracking.ticketTitle", { code: ticket.code })}
              </h2>
              <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("common.status")}</span>
                  <span className="rounded-full bg-primary/10 px-3 py-0.5 text-sm font-medium text-primary">
                    {statusLabels[ticket.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("common.created")}</span>
                  <span className="text-sm">{formatDate(ticket.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("publicTicketTracking.lastUpdated")}</span>
                  <span className="text-sm">{formatDate(ticket.updatedAt)}</span>
                </div>
              </div>
            </div>
          ) : null}

          <p className="mt-6 text-sm text-muted-foreground">
            {t("publicTicketTracking.needNewTicket")}{" "}
            <Link
              className="font-semibold text-primary hover:text-primary/80"
              to={`/${orgSlug}/tickets/new`}
            >
              {t("publicTicketTracking.submitTicket")}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default PublicTicketTrackingPage;
