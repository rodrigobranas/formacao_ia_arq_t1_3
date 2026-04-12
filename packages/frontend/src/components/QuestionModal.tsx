import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type QuestionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function QuestionModal({ open, onOpenChange }: QuestionModalProps) {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setPrompt("");
    setAnswer(null);
    setError(null);
    setIsSubmitting(false);
  }, [open]);

  const handleSubmit = async () => {
    const trimmed = prompt.trim();

    if (!trimmed) {
      setError(t("chat.emptyPrompt"));
      return;
    }

    setError(null);
    setAnswer(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/chat/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          message?: string;
          error?: string;
        };
        setError(data.message ?? data.error ?? t("chat.questionError"));
        return;
      }

      const contentType = response.headers.get("Content-Type") ?? "";
      if (!contentType.includes("text/plain")) {
        setError(t("chat.questionError"));
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setError(t("chat.questionError"));
        return;
      }

      setAnswer("");
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        accumulated += decoder.decode(value, { stream: true });
        setAnswer(accumulated);
      }
      accumulated += decoder.decode();

      const finalText = accumulated.trim();
      setAnswer(finalText ? finalText : t("chat.emptyModelResponse"));
    } catch {
      setError(t("chat.questionError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("chat.title")}</DialogTitle>
          <DialogDescription>{t("chat.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Textarea
            id="ticket-question"
            name="ticketQuestion"
            placeholder={t("chat.placeholder")}
            value={prompt}
            disabled={isSubmitting}
            onChange={(event) => setPrompt(event.target.value)}
          />

          {error ? (
            <div
              className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          {answer ? (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">{t("chat.responseLabel")}</p>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-border/60 bg-muted/30 p-3 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {answer}
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="button" disabled={isSubmitting} onClick={() => void handleSubmit()}>
            {isSubmitting ? t("common.sending") : t("common.send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
