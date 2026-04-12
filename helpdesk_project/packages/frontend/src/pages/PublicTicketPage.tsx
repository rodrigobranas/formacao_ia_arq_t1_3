import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  AttachmentInput,
  CreatePublicTicketResponse,
  TicketType,
} from "@/types/types";

const MAX_FILE_SIZE_BYTES = 1_048_576;

type FormValues = {
  name: string;
  email: string;
  phone: string;
  description: string;
  ticketTypeId: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>> & {
  attachments?: string;
  form?: string;
};

const initialFormValues: FormValues = {
  name: "",
  email: "",
  phone: "",
  description: "",
  ticketTypeId: "",
};

function validateForm(values: FormValues, t: (key: string) => string): FormErrors {
  const errors: FormErrors = {};
  if (values.name.trim().length === 0) errors.name = t("validation.nameRequired");
  if (values.email.trim().length === 0) errors.email = t("validation.emailRequired");
  if (values.phone.trim().length === 0) errors.phone = t("validation.phoneRequired");
  if (values.description.trim().length === 0)
    errors.description = t("validation.descriptionRequired");
  return errors;
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

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string; message?: string };
    return body.error ?? body.message ?? "Something went wrong. Please try again.";
  } catch {
    return "Something went wrong. Please try again.";
  }
}

function PublicTicketPage() {
  const { t } = useTranslation();
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [formValues, setFormValues] = useState(initialFormValues);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketCode, setTicketCode] = useState<string | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadTicketTypes() {
      try {
        const response = await fetch(`/api/public/${orgSlug}/ticket-types`);
        if (response.ok) {
          const data = (await response.json()) as TicketType[];
          if (isMounted) setTicketTypes(data);
        }
      } catch {
        // ticket types are optional, silently ignore
      }
    }

    void loadTicketTypes();
    return () => {
      isMounted = false;
    };
  }, [orgSlug]);

  function updateField(field: keyof FormValues, value: string) {
    setFormValues((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files) return;
    const fileList = Array.from(files);
    const oversized = fileList.find((file) => file.size > MAX_FILE_SIZE_BYTES);
    if (oversized) {
      setFormErrors((current) => ({
        ...current,
        attachments: t("publicTicket.fileSizeError", { name: oversized.name }),
      }));
      event.target.value = "";
      return;
    }
    setAttachments(fileList);
    setFormErrors((current) => ({ ...current, attachments: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateForm(formValues, t);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setFormErrors({});

      const attachmentPayloads: AttachmentInput[] = [];
      for (const file of attachments) {
        const content = await readFileAsBase64(file);
        attachmentPayloads.push({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          content,
        });
      }

      const payload = {
        name: formValues.name.trim(),
        email: formValues.email.trim().toLowerCase(),
        phone: formValues.phone.trim(),
        description: formValues.description.trim(),
        ...(formValues.ticketTypeId
          ? { ticketTypeId: Number(formValues.ticketTypeId) }
          : {}),
        ...(attachmentPayloads.length > 0
          ? { attachments: attachmentPayloads }
          : {}),
      };

      const response = await fetch(`/api/public/${orgSlug}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await readErrorMessage(response);
        setFormErrors({ form: message });
        return;
      }

      const result = (await response.json()) as CreatePublicTicketResponse;
      setTicketCode(result.code);
    } catch (error) {
      setFormErrors({
        form:
          error instanceof Error
            ? error.message
            : t("common.somethingWentWrong"),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderFieldError(field: keyof FormValues | "attachments") {
    if (!formErrors[field]) return null;
    return <p className="text-xs text-destructive">{formErrors[field]}</p>;
  }

  if (ticketCode) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(32,156,255,0.12),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,1))] px-6 py-16 text-foreground dark:bg-[radial-gradient(circle_at_top,rgba(32,156,255,0.08),transparent_35%),linear-gradient(180deg,hsl(215_25%_9%),hsl(215_25%_9%))]">
        <section className="mx-auto max-w-lg">
          <div className="rounded-[28px] border border-border/70 bg-card/95 p-8 shadow-soft sm:p-10 text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent-foreground">
              {t("publicTicket.createdBadge")}
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {t("publicTicket.createdTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("publicTicket.createdDescription")}
            </p>
            <div
              className="rounded-xl border border-border bg-muted/50 px-6 py-4 font-mono text-2xl font-bold tracking-wider"
              data-testid="ticket-code"
            >
              {ticketCode}
            </div>
            <div className="flex flex-col items-center gap-2">
              <Link
                className="inline-block text-sm font-semibold text-primary hover:text-primary/80"
                to={`/${orgSlug}/tickets/track`}
              >
                {t("publicTicket.trackTicket")}
              </Link>
              <Link
                className="inline-block text-sm text-muted-foreground hover:text-foreground"
                to="/tickets"
              >
                {t("publicTicket.backToTickets")}
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(32,156,255,0.12),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,1))] px-6 py-16 text-foreground dark:bg-[radial-gradient(circle_at_top,rgba(32,156,255,0.08),transparent_35%),linear-gradient(180deg,hsl(215_25%_9%),hsl(215_25%_9%))]">
      <section className="mx-auto max-w-lg">
        <div className="rounded-[28px] border border-border/70 bg-card/95 p-8 shadow-soft sm:p-10">
          <div className="mb-8 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              {t("publicTicket.supportBadge")}
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {t("publicTicket.title")}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("publicTicket.subtitle")}
            </p>
          </div>

          <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="name">
                {t("common.name")}
              </label>
              <Input
                aria-invalid={Boolean(formErrors.name)}
                id="name"
                name="name"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateField("name", event.target.value)
                }
                placeholder={t("publicTicket.namePlaceholder")}
                value={formValues.name}
              />
              {renderFieldError("name")}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="email">
                {t("common.email")}
              </label>
              <Input
                aria-invalid={Boolean(formErrors.email)}
                id="email"
                name="email"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateField("email", event.target.value)
                }
                placeholder={t("publicTicket.emailPlaceholder")}
                type="email"
                value={formValues.email}
              />
              {renderFieldError("email")}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="phone">
                {t("common.phone")}
              </label>
              <Input
                aria-invalid={Boolean(formErrors.phone)}
                id="phone"
                name="phone"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateField("phone", event.target.value)
                }
                placeholder={t("publicTicket.phonePlaceholder")}
                type="tel"
                value={formValues.phone}
              />
              {renderFieldError("phone")}
            </div>

            {ticketTypes.length > 0 ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="ticketTypeId">
                  {t("publicTicket.ticketTypeLabel")}
                </label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  id="ticketTypeId"
                  name="ticketTypeId"
                  onChange={(event) => updateField("ticketTypeId", event.target.value)}
                  value={formValues.ticketTypeId}
                >
                  <option value="">{t("publicTicket.selectType")}</option>
                  {ticketTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="description">
                {t("common.description")}
              </label>
              <textarea
                aria-invalid={Boolean(formErrors.description)}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                id="description"
                name="description"
                onChange={(event) => updateField("description", event.target.value)}
                placeholder={t("publicTicket.descriptionPlaceholder")}
                value={formValues.description}
              />
              {renderFieldError("description")}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="attachments">
                {t("publicTicket.attachmentsLabel")}
              </label>
              <Input
                accept="*/*"
                id="attachments"
                multiple
                name="attachments"
                onChange={handleFileChange}
                type="file"
              />
              <p className="text-xs text-muted-foreground">{t("publicTicket.maxFileSize")}</p>
              {renderFieldError("attachments")}
            </div>

            {formErrors.form ? (
              <div
                className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                role="alert"
              >
                {formErrors.form}
              </div>
            ) : null}

            <Button className="w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? t("publicTicket.submitting") : t("publicTicket.submit")}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default PublicTicketPage;
