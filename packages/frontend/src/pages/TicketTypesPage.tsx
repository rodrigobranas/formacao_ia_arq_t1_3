import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/store/AuthContext";
import {
  AlertDialog,
  AlertDialogActionButton,
  AlertDialogCancelButton,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TicketType } from "@/types/types";

const NAME_MAX_LENGTH = 50;
const DESCRIPTION_MAX_LENGTH = 255;

type FormValues = {
  name: string;
  description: string;
};

type FormErrors = {
  name?: string;
  description?: string;
  form?: string;
};

type FormMode =
  | {
      type: "create";
    }
  | {
      type: "edit";
      id: number;
    }
  | null;

function sortTicketTypes(ticketTypes: TicketType[]) {
  return [...ticketTypes].sort((first, second) =>
    first.name.localeCompare(second.name, "pt-BR", { sensitivity: "base" }),
  );
}

function normalizeFormValues(values: FormValues) {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
  };
}

function validateForm(values: FormValues, t: (key: string) => string): FormErrors {
  const errors: FormErrors = {};
  const normalizedValues = normalizeFormValues(values);

  if (normalizedValues.name.length === 0) {
    errors.name = t("validation.nameRequired");
  } else if (normalizedValues.name.length > NAME_MAX_LENGTH) {
    errors.name = t("ticketTypes.nameMaxLength");
  }

  if (normalizedValues.description.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = t("ticketTypes.descriptionMaxLength");
  }

  return errors;
}

async function readErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? "Something went wrong. Please try again.";
  } catch {
    return "Something went wrong. Please try again.";
  }
}

function mapServerError(message: string): FormErrors {
  if (/^name /i.test(message) || /ticket type with this name/i.test(message)) {
    return { name: message };
  }

  if (/^description /i.test(message)) {
    return { description: message };
  }

  return { form: message };
}

function toFormValues(ticketType?: TicketType): FormValues {
  return {
    name: ticketType?.name ?? "",
    description: ticketType?.description ?? "",
  };
}

function TicketTypesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.admin === true;
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [formValues, setFormValues] = useState<FormValues>(toFormValues());
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TicketType | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadTicketTypes() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const response = await fetch("/api/ticket-types");

        if (!response.ok) {
          throw new Error(await readErrorMessage(response));
        }

        const data = (await response.json()) as TicketType[];

        if (isMounted) {
          setTicketTypes(data);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : t("ticketTypes.loadError"),
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadTicketTypes();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeEditId = formMode?.type === "edit" ? formMode.id : null;
  const hasInlineForm = formMode !== null;
  const emptyStateVisible =
    !isLoading && ticketTypes.length === 0 && formMode?.type !== "create";

  const pageDescription = t("ticketTypes.description");

  function resetFormState() {
    setFormMode(null);
    setFormValues(toFormValues());
    setFormErrors({});
    setIsSaving(false);
  }

  function handleCreateStart() {
    setDeleteTarget(null);
    setDeleteError(null);
    setFormMode({ type: "create" });
    setFormValues(toFormValues());
    setFormErrors({});
  }

  function handleEditStart(ticketType: TicketType) {
    setDeleteTarget(null);
    setDeleteError(null);
    setFormMode({ type: "edit", id: ticketType.id });
    setFormValues(toFormValues(ticketType));
    setFormErrors({});
  }

  function handleCancelForm() {
    resetFormState();
  }

  function updateFormValue(field: keyof FormValues, value: string) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
    setFormErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
      form: undefined,
    }));
  }

  async function handleSave() {
    const validationErrors = validateForm(formValues, t);

    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    const normalizedValues = normalizeFormValues(formValues);

    try {
      setIsSaving(true);
      setFormErrors({});

      const isCreate = formMode?.type === "create";
      const endpoint = isCreate
        ? "/api/ticket-types"
        : `/api/ticket-types/${formMode?.id}`;
      const method = isCreate ? "POST" : "PUT";
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(normalizedValues),
      });

      if (!response.ok) {
        const message = await readErrorMessage(response);
        setFormErrors(mapServerError(message));
        return;
      }

      const savedTicketType = (await response.json()) as TicketType;

      setTicketTypes((currentTicketTypes) => {
        const nextTicketTypes = isCreate
          ? [savedTicketType, ...currentTicketTypes]
          : currentTicketTypes.map((ticketType) =>
              ticketType.id === savedTicketType.id ? savedTicketType : ticketType,
            );

        return sortTicketTypes(nextTicketTypes);
      });

      resetFormState();
    } catch (error) {
      setFormErrors({
        form:
          error instanceof Error
            ? error.message
            : t("ticketTypes.saveError"),
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);

      const response = await fetch(`/api/ticket-types/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const message = await readErrorMessage(response);
        setDeleteError(message);
        return;
      }

      setTicketTypes((currentTicketTypes) =>
        currentTicketTypes.filter(
          (ticketType) => ticketType.id !== deleteTarget.id,
        ),
      );
      setDeleteTarget(null);
      setDeleteError(null);
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : t("ticketTypes.deleteError"),
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <h2 className="font-display text-2xl font-bold tracking-tight">{t("ticketTypes.title")}</h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            {pageDescription}
          </p>
        </div>
        {isAdmin ? (
          <Button disabled={hasInlineForm} onClick={handleCreateStart}>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            {t("ticketTypes.newType")}
          </Button>
        ) : null}
      </div>

      {loadError ? (
        <div
          className="flex items-center gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          {loadError}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border/60 shadow-soft">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t("common.name")}</TableHead>
              <TableHead>{t("common.description")}</TableHead>
              {isAdmin ? (
                <TableHead className="w-[200px] text-right">{t("common.actions")}</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {formMode?.type === "create" ? (
              <TableRow className="bg-primary/3 align-top hover:bg-primary/5">
                <TableCell className="align-top">
                  <div className="space-y-1.5">
                    <Input
                      aria-invalid={Boolean(formErrors.name)}
                      name="name"
                      onChange={(event) =>
                        updateFormValue("name", event.target.value)
                      }
                      placeholder={t("ticketTypes.namePlaceholder")}
                      value={formValues.name}
                    />
                    {formErrors.name ? (
                      <p className="text-xs text-destructive">
                        {formErrors.name}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <div className="space-y-1.5">
                    <Input
                      aria-invalid={Boolean(formErrors.description)}
                      name="description"
                      onChange={(event) =>
                        updateFormValue("description", event.target.value)
                      }
                      placeholder={t("ticketTypes.descriptionPlaceholder")}
                      value={formValues.description}
                    />
                    {formErrors.description ? (
                      <p className="text-xs text-destructive">
                        {formErrors.description}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="space-y-2 text-right align-top">
                  <div className="flex justify-end gap-2">
                    <Button
                      disabled={isSaving}
                      onClick={() => void handleSave()}
                      size="sm"
                    >
                      {isSaving ? t("common.saving") : t("common.save")}
                    </Button>
                    <Button
                      disabled={isSaving}
                      onClick={handleCancelForm}
                      size="sm"
                      variant="outline"
                    >
                      {t("common.cancel")}
                    </Button>
                  </div>
                  {formErrors.form ? (
                    <p className="text-xs text-destructive">
                      {formErrors.form}
                    </p>
                  ) : null}
                </TableCell>
              </TableRow>
            ) : null}

            {ticketTypes.map((ticketType) => {
              const isEditing = activeEditId === ticketType.id;

              if (isEditing) {
                return (
                  <TableRow
                    className="bg-primary/3 align-top hover:bg-primary/5"
                    key={ticketType.id}
                  >
                    <TableCell className="align-top">
                      <div className="space-y-1.5">
                        <Input
                          aria-invalid={Boolean(formErrors.name)}
                          name={`name-${ticketType.id}`}
                          onChange={(event) =>
                            updateFormValue("name", event.target.value)
                          }
                          value={formValues.name}
                        />
                        {formErrors.name ? (
                          <p className="text-xs text-destructive">
                            {formErrors.name}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="space-y-1.5">
                        <Input
                          aria-invalid={Boolean(formErrors.description)}
                          name={`description-${ticketType.id}`}
                          onChange={(event) =>
                            updateFormValue("description", event.target.value)
                          }
                          value={formValues.description}
                        />
                        {formErrors.description ? (
                          <p className="text-xs text-destructive">
                            {formErrors.description}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="space-y-2 text-right align-top">
                      <div className="flex justify-end gap-2">
                        <Button
                          disabled={isSaving}
                          onClick={() => void handleSave()}
                          size="sm"
                        >
                          {isSaving ? t("common.saving") : t("common.save")}
                        </Button>
                        <Button
                          disabled={isSaving}
                          onClick={handleCancelForm}
                          size="sm"
                          variant="outline"
                        >
                          {t("common.cancel")}
                        </Button>
                      </div>
                      {formErrors.form ? (
                        <p className="text-xs text-destructive">
                          {formErrors.form}
                        </p>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              }

              return (
                <TableRow key={ticketType.id}>
                  <TableCell className="font-medium">
                    {ticketType.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {ticketType.description || "—"}
                  </TableCell>
                  {isAdmin ? (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          disabled={hasInlineForm}
                          onClick={() => handleEditStart(ticketType)}
                          size="sm"
                          variant="outline"
                        >
                          {t("common.edit")}
                        </Button>
                        <AlertDialog
                          onOpenChange={(open) => {
                            if (!open) {
                              setDeleteTarget((currentTarget) =>
                                currentTarget?.id === ticketType.id
                                  ? null
                                  : currentTarget,
                              );
                              setDeleteError(null);
                            }
                          }}
                          open={deleteTarget?.id === ticketType.id}
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              disabled={hasInlineForm}
                              onClick={() => {
                                setDeleteTarget(ticketType);
                                setDeleteError(null);
                              }}
                              size="sm"
                              variant="ghost"
                            >
                              {t("common.delete")}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t("ticketTypes.deleteTitle")}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("ticketTypes.deleteDescription", { name: ticketType.name })}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            {deleteError ? (
                              <p
                                className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                                role="alert"
                              >
                                {deleteError}
                              </p>
                            ) : null}
                            <AlertDialogFooter>
                              <AlertDialogCancelButton disabled={isDeleting}>
                                {t("common.cancel")}
                              </AlertDialogCancelButton>
                              <AlertDialogActionButton
                                disabled={isDeleting}
                                onClick={(event) => {
                                  event.preventDefault();
                                  void handleDeleteConfirm();
                                }}
                              >
                                {isDeleting ? t("common.deleting") : t("common.delete")}
                              </AlertDialogActionButton>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {isLoading ? (
          <div className="flex items-center justify-center gap-3 border-t border-border/60 px-4 py-10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <span className="text-sm text-muted-foreground">
              {t("ticketTypes.loadingTicketTypes")}
            </span>
          </div>
        ) : null}

        {emptyStateVisible ? (
          <div className="flex flex-col items-center gap-3 border-t border-border/60 px-4 py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <svg
                className="h-6 w-6 text-muted-foreground/60"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
                <path d="M14 3v4a2 2 0 0 0 2 2h4" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-display text-sm font-medium text-foreground">
                {t("ticketTypes.noTicketTypesYet")}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("ticketTypes.noTicketTypesDescription")}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default TicketTypesPage;
