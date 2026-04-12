import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  TicketAttachment,
  TicketDetail,
  TicketSentiment,
  User,
} from "@/types/types";

const MAX_ATTACHMENT_SIZE = 1_048_576;

type TimelineEntry =
  | { type: "assignment"; assignedToName: string; assignedByName: string; createdAt: string }
  | { type: "comment"; id: number; userName: string; content: string; attachments: TicketAttachment[]; createdAt: string };

function buildTimeline(ticket: TicketDetail): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  for (const assignment of ticket.assignments) {
    entries.push({ type: "assignment", ...assignment });
  }
  for (const comment of ticket.comments) {
    entries.push({ type: "comment", ...comment });
  }
  entries.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return entries;
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: "bg-primary/10 text-primary border-primary/20 font-semibold",
    assigned: "bg-accent/10 text-accent-foreground border-accent/20",
    closed: "bg-muted text-muted-foreground border-border",
  };
  const className = styles[status] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs ${className}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function SentimentBadge({
  sentiment,
  labelPositive,
  labelNeutral,
  labelNegative,
}: {
  sentiment: TicketSentiment | null;
  labelPositive: string;
  labelNeutral: string;
  labelNegative: string;
}) {
  if (!sentiment) {
    return <span className="text-muted-foreground">-</span>;
  }
  const labels: Record<TicketSentiment, string> = {
    positive: labelPositive,
    neutral: labelNeutral,
    negative: labelNegative,
  };
  const styles: Record<TicketSentiment, string> = {
    positive: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/25",
    neutral: "bg-muted text-muted-foreground border-border",
    negative: "bg-destructive/10 text-destructive border-destructive/20",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs ${styles[sentiment]}`}>
      {labels[sentiment]}
    </span>
  );
}

function AttachmentLink({ attachment }: { attachment: TicketAttachment }) {
  const href = `data:${attachment.contentType};base64,${attachment.content}`;
  return (
    <a
      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      download={attachment.filename}
      href={href}
    >
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" x2="12" y1="15" y2="3" />
      </svg>
      {attachment.filename}
    </a>
  );
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function TicketDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActioning, setIsActioning] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [forwardUserId, setForwardUserId] = useState("");
  const [showForward, setShowForward] = useState(false);

  const [commentContent, setCommentContent] = useState("");
  const [commentFile, setCommentFile] = useState<File | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isClassifyingSentiment, setIsClassifyingSentiment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadTicket = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/tickets/${id}`);
      if (response.status === 404) {
        setError(t("ticketDetail.ticketNotFound"));
        setTicket(null);
        return;
      }
      if (!response.ok) {
        throw new Error(t("ticketDetail.loadError"));
      }
      const data = (await response.json()) as TicketDetail;
      setTicket(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("ticketDetail.loadError"));
      setTicket(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadTicket();
  }, [loadTicket]);

  async function handleAssign() {
    try {
      setIsActioning(true);
      setActionError(null);
      const response = await fetch(`/api/tickets/${id}/assign`, { method: "POST" });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? t("ticketDetail.assignError"));
      }
      await loadTicket();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("ticketDetail.assignError"));
    } finally {
      setIsActioning(false);
    }
  }

  async function handleForward() {
    if (!forwardUserId) {
      setActionError(t("ticketDetail.selectUserError"));
      return;
    }
    try {
      setIsActioning(true);
      setActionError(null);
      const response = await fetch(`/api/tickets/${id}/forward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(forwardUserId) }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? t("ticketDetail.forwardError"));
      }
      setShowForward(false);
      setForwardUserId("");
      await loadTicket();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("ticketDetail.forwardError"));
    } finally {
      setIsActioning(false);
    }
  }

  async function handleClassifySentiment() {
    if (!id) return;
    try {
      setIsClassifyingSentiment(true);
      setActionError(null);
      const response = await fetch(`/api/tickets/${id}/classify-sentiment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; sentiment?: TicketSentiment };
      if (!response.ok) {
        throw new Error(data.error ?? t("ticketDetail.classifySentimentError"));
      }
      if (data.sentiment !== "positive" && data.sentiment !== "neutral" && data.sentiment !== "negative") {
        throw new Error(t("ticketDetail.classifySentimentError"));
      }
      setTicket((prev) => (prev ? { ...prev, sentiment: data.sentiment! } : null));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("ticketDetail.classifySentimentError"));
    } finally {
      setIsClassifyingSentiment(false);
    }
  }

  async function handleClose() {
    try {
      setIsActioning(true);
      setActionError(null);
      const response = await fetch(`/api/tickets/${id}/close`, { method: "POST" });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? t("ticketDetail.closeError"));
      }
      await loadTicket();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("ticketDetail.closeError"));
    } finally {
      setIsActioning(false);
    }
  }

  async function handleAddComment() {
    const trimmedContent = commentContent.trim();
    if (!trimmedContent) {
      setCommentError(t("ticketDetail.commentEmptyError"));
      return;
    }
    if (commentFile && commentFile.size > MAX_ATTACHMENT_SIZE) {
      setCommentError(t("ticketDetail.attachmentSizeError"));
      return;
    }
    try {
      setIsSubmittingComment(true);
      setCommentError(null);
      const payload: { content: string; attachments?: { filename: string; contentType: string; content: string }[] } = {
        content: trimmedContent,
      };
      if (commentFile) {
        const base64 = await readFileAsBase64(commentFile);
        payload.attachments = [{
          filename: commentFile.name,
          contentType: commentFile.type || "application/octet-stream",
          content: base64,
        }];
      }
      const response = await fetch(`/api/tickets/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? t("ticketDetail.commentError"));
      }
      setCommentContent("");
      setCommentFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await loadTicket();
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : t("ticketDetail.commentError"));
    } finally {
      setIsSubmittingComment(false);
    }
  }

  function handleShowForward() {
    setShowForward(true);
    if (users.length === 0) {
      void loadUsers();
    }
  }

  async function loadUsers() {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = (await response.json()) as User[];
        setUsers(data);
      }
    } catch {
      // silently fail — user list is supplementary
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setCommentFile(file);
    setCommentError(null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 p-12">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <span className="text-sm text-muted-foreground">{t("ticketDetail.loadingTicket")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-6">
        <div
          className="flex items-center gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
        <Link className="text-sm text-primary hover:underline" to="/tickets">
          {t("ticketDetail.backToTickets")}
        </Link>
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  const timeline = buildTimeline(ticket);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link className="hover:underline" to="/tickets">{t("ticketDetail.breadcrumbTickets")}</Link>
        <span>/</span>
        <span>{ticket.code}</span>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl font-bold tracking-tight">{ticket.code}</h2>
            <StatusBadge status={ticket.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {t("ticketDetail.openedBy", { name: ticket.name, date: formatDateTime(ticket.createdAt) })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={isActioning || isClassifyingSentiment}
            onClick={() => void handleClassifySentiment()}
            size="sm"
            variant="outline"
          >
            {isClassifyingSentiment ? t("ticketDetail.classifyingSentiment") : t("ticketDetail.classifySentiment")}
          </Button>
          {ticket.status === "new" && (
            <Button
              disabled={isActioning}
              onClick={() => void handleAssign()}
            >
              {isActioning ? t("ticketDetail.assigning") : t("ticketDetail.assignToMe")}
            </Button>
          )}
          {ticket.status === "assigned" && (
            <>
              <Button
                disabled={isActioning}
                onClick={handleShowForward}
                variant="outline"
              >
                {t("ticketDetail.forward")}
              </Button>
              <Button
                disabled={isActioning}
                onClick={() => void handleClose()}
                variant="outline"
              >
                {isActioning ? t("common.closing") : t("common.close")}
              </Button>
            </>
          )}
        </div>
      </div>

      {actionError && (
        <div
          className="flex items-center gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {actionError}
        </div>
      )}

      {showForward && ticket.status === "assigned" && (
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-4">
          <label className="text-sm font-medium" htmlFor="forward-user">{t("ticketDetail.forwardTo")}</label>
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="forward-user"
            onChange={(e) => setForwardUserId(e.target.value)}
            value={forwardUserId}
          >
            <option value="">{t("ticketDetail.selectUser")}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <Button
            disabled={isActioning || !forwardUserId}
            onClick={() => void handleForward()}
            size="sm"
          >
            {isActioning ? t("ticketDetail.forwarding") : t("common.confirm")}
          </Button>
          <Button
            disabled={isActioning}
            onClick={() => { setShowForward(false); setForwardUserId(""); }}
            size="sm"
            variant="outline"
          >
            {t("common.cancel")}
          </Button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-4 rounded-xl border border-border/60 p-5 shadow-soft md:col-span-1">
          <h3 className="text-sm font-semibold">{t("ticketDetail.details")}</h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">{t("ticketDetail.customer")}</dt>
              <dd className="font-medium">{ticket.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("common.email")}</dt>
              <dd>{ticket.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("common.phone")}</dt>
              <dd>{ticket.phone}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("common.type")}</dt>
              <dd>{ticket.ticketTypeName ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("ticketDetail.sentiment")}</dt>
              <dd>
                <SentimentBadge
                  labelNegative={t("ticketDetail.sentimentNegative")}
                  labelNeutral={t("ticketDetail.sentimentNeutral")}
                  labelPositive={t("ticketDetail.sentimentPositive")}
                  sentiment={ticket.sentiment}
                />
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("ticketDetail.assignee")}</dt>
              <dd>{ticket.assignedToName ?? t("ticketDetail.unassigned")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("ticketDetail.updated")}</dt>
              <dd>{formatDateTime(ticket.updatedAt)}</dd>
            </div>
          </dl>

          {ticket.attachments.length > 0 && (
            <div className="space-y-2 border-t border-border/60 pt-4">
              <h4 className="text-sm font-semibold">{t("ticketDetail.attachments")}</h4>
              <div className="space-y-1">
                {ticket.attachments.map((attachment) => (
                  <AttachmentLink attachment={attachment} key={attachment.id} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 md:col-span-2">
          <div className="rounded-xl border border-border/60 p-5 shadow-soft">
            <h3 className="text-sm font-semibold">{t("common.description")}</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{ticket.description}</p>
          </div>

          <div className="rounded-xl border border-border/60 p-5 shadow-soft">
            <h3 className="mb-4 text-sm font-semibold">{t("ticketDetail.timeline")}</h3>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("ticketDetail.noActivityYet")}</p>
            ) : (
              <div className="space-y-4">
                {timeline.map((entry, index) => (
                  <div className="border-l-2 border-border pl-4" key={index}>
                    {entry.type === "assignment" ? (
                      <div>
                        <p className="text-sm">{t("ticketDetail.assignedTo", { assignedBy: entry.assignedByName, assignedTo: entry.assignedToName })}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{entry.userName}</span>
                          <span className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{entry.content}</p>
                        {entry.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {entry.attachments.map((attachment) => (
                              <AttachmentLink attachment={attachment} key={attachment.id} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border/60 p-5 shadow-soft">
            <h3 className="mb-4 text-sm font-semibold">{t("ticketDetail.addComment")}</h3>
            <div className="space-y-3">
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(e) => { setCommentContent(e.target.value); setCommentError(null); }}
                placeholder={t("ticketDetail.commentPlaceholder")}
                rows={3}
                value={commentContent}
              />
              <div className="flex items-center gap-3">
                <Input
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  type="file"
                />
                <Button
                  disabled={isSubmittingComment}
                  onClick={() => void handleAddComment()}
                  size="sm"
                >
                  {isSubmittingComment ? t("common.sending") : t("common.send")}
                </Button>
              </div>
              {commentError && (
                <p className="text-xs text-destructive" role="alert">{commentError}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketDetailPage;
