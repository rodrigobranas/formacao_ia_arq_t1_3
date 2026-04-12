import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Loader2, Wrench } from "lucide-react";

const formatJson = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const ChatToolCallPart = (props: ToolCallMessagePartProps) => {
  const { t } = useTranslation();
  const { toolName, argsText, args, result, isError, status } = props;
  const isRunning = status.type === "running";
  const needsAction = status.type === "requires-action";
  const isIncomplete = status.type === "incomplete";
  const argsPreview =
    argsText.trim() !== "" ? argsText : formatJson(args);

  const statusNote = (() => {
    if (needsAction) return t("chat.toolNeedsAction");
    if (!isIncomplete) return null;
    if (status.reason === "cancelled") return t("chat.toolCancelled");
    return t("chat.toolIncomplete");
  })();

  return (
    <div
      className={cn(
        "mt-2 w-full min-w-0 rounded-md border border-border bg-background/90 px-3 py-2 text-xs",
        isError && "border-destructive/40 bg-destructive/5",
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2 font-medium text-foreground">
        {isRunning ? (
          <Loader2
            className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground"
            aria-hidden
          />
        ) : (
          <Wrench
            className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
        )}
        <span className="truncate" title={toolName}>
          {toolName}
        </span>
        {isRunning ? (
          <span className="text-muted-foreground">{t("chat.toolRunning")}</span>
        ) : null}
      </div>
      {statusNote ? (
        <p className="mb-2 text-[11px] text-muted-foreground">{statusNote}</p>
      ) : null}
      <div className="space-y-2 text-muted-foreground">
        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide">
            {t("chat.toolArguments")}
          </div>
          <pre className="max-h-32 overflow-auto whitespace-pre-wrap wrap-break-word rounded bg-muted/60 p-2 font-mono text-[11px] leading-relaxed">
            {argsPreview || "—"}
          </pre>
        </div>
        {result !== undefined ? (
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide">
              {t("chat.toolResult")}
            </div>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap wrap-break-word rounded bg-muted/60 p-2 font-mono text-[11px] leading-relaxed">
              {formatJson(result)}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ChatToolCallPart;
