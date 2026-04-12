import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { useAuth } from "@/store/AuthContext";
import type { User } from "@/types/types";

const PASSWORD_MIN_LENGTH = 8;

type FormValues = {
  name: string;
  email: string;
  password: string;
  admin: boolean;
};

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  form?: string;
};

function emptyFormValues(): FormValues {
  return { name: "", email: "", password: "", admin: false };
}

function validateForm(values: FormValues, t: (key: string) => string): FormErrors {
  const errors: FormErrors = {};
  const trimmedName = values.name.trim();
  const trimmedEmail = values.email.trim();
  const trimmedPassword = values.password.trim();

  if (trimmedName.length === 0) {
    errors.name = t("validation.nameRequired");
  }

  if (trimmedEmail.length === 0) {
    errors.email = t("validation.emailRequired");
  }

  if (trimmedPassword.length === 0) {
    errors.password = t("validation.passwordRequired");
  } else if (trimmedPassword.length < PASSWORD_MIN_LENGTH) {
    errors.password = t("validation.passwordMinLength");
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
  if (/email/i.test(message)) {
    return { email: message };
  }

  if (/password/i.test(message)) {
    return { password: message };
  }

  if (/name/i.test(message)) {
    return { name: message };
  }

  return { form: message };
}

function UsersPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formValues, setFormValues] = useState<FormValues>(emptyFormValues());
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const response = await fetch("/api/users");

        if (!response.ok) {
          throw new Error(await readErrorMessage(response));
        }

        const data = (await response.json()) as User[];

        if (isMounted) {
          setUsers(data);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : t("users.loadError"),
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const pageDescription = t("users.description");

  function handleCreateStart() {
    setDeleteTarget(null);
    setDeleteError(null);
    setShowForm(true);
    setFormValues(emptyFormValues());
    setFormErrors({});
  }

  function handleCancelForm() {
    setShowForm(false);
    setFormValues(emptyFormValues());
    setFormErrors({});
    setIsSaving(false);
  }

  function updateFormValue(field: keyof FormValues, value: string | boolean) {
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

    try {
      setIsSaving(true);
      setFormErrors({});

      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formValues.name.trim(),
          email: formValues.email.trim(),
          password: formValues.password.trim(),
          admin: formValues.admin,
        }),
      });

      if (!response.ok) {
        const message = await readErrorMessage(response);
        setFormErrors(mapServerError(message));
        return;
      }

      const savedUser = (await response.json()) as User;

      setUsers((currentUsers) =>
        [...currentUsers, savedUser].sort((first, second) =>
          first.name.localeCompare(second.name, "en", { sensitivity: "base" }),
        ),
      );

      setShowForm(false);
      setFormValues(emptyFormValues());
      setFormErrors({});
    } catch (error) {
      setFormErrors({
        form:
          error instanceof Error
            ? error.message
            : t("users.createError"),
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

      const response = await fetch(`/api/users/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const message = await readErrorMessage(response);
        setDeleteError(message);
        return;
      }

      setUsers((currentUsers) =>
        currentUsers.filter((user) => user.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
      setDeleteError(null);
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : t("users.deleteError"),
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <h2 className="font-display text-2xl font-bold tracking-tight">{t("users.title")}</h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            {pageDescription}
          </p>
        </div>
        <Button disabled={showForm} onClick={handleCreateStart}>
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
          {t("users.newUser")}
        </Button>
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

      {showForm ? (
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-soft">
          <h3 className="mb-4 font-display text-lg font-semibold tracking-tight">{t("users.createUser")}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Input
                aria-invalid={Boolean(formErrors.name)}
                name="name"
                onChange={(event) => updateFormValue("name", event.target.value)}
                placeholder={t("users.namePlaceholder")}
                value={formValues.name}
              />
              {formErrors.name ? (
                <p className="text-xs text-destructive">{formErrors.name}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Input
                aria-invalid={Boolean(formErrors.email)}
                name="email"
                onChange={(event) => updateFormValue("email", event.target.value)}
                placeholder={t("users.emailPlaceholder")}
                type="email"
                value={formValues.email}
              />
              {formErrors.email ? (
                <p className="text-xs text-destructive">{formErrors.email}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Input
                aria-invalid={Boolean(formErrors.password)}
                name="password"
                onChange={(event) => updateFormValue("password", event.target.value)}
                placeholder={t("users.passwordPlaceholder")}
                type="password"
                value={formValues.password}
              />
              {formErrors.password ? (
                <p className="text-xs text-destructive">{formErrors.password}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <input
                  checked={formValues.admin}
                  className="h-4 w-4 rounded border-border"
                  onChange={(event) => updateFormValue("admin", event.target.checked)}
                  type="checkbox"
                />
                {t("users.admin")}
              </label>
            </div>
          </div>
          {formErrors.form ? (
            <p className="mt-3 text-xs text-destructive">{formErrors.form}</p>
          ) : null}
          <div className="mt-4 flex gap-2">
            <Button disabled={isSaving} onClick={() => void handleSave()} size="sm">
              {isSaving ? t("common.saving") : t("common.save")}
            </Button>
            <Button disabled={isSaving} onClick={handleCancelForm} size="sm" variant="outline">
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border/60 shadow-soft">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t("common.name")}</TableHead>
              <TableHead>{t("common.email")}</TableHead>
              <TableHead>{t("users.role")}</TableHead>
              <TableHead className="w-[120px] text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <span
                    className={
                      user.admin
                        ? "inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                        : "inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                    }
                  >
                    {user.admin ? t("users.admin") : t("users.regular")}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog
                    onOpenChange={(open) => {
                      if (!open) {
                        setDeleteTarget((currentTarget) =>
                          currentTarget?.id === user.id ? null : currentTarget,
                        );
                        setDeleteError(null);
                      }
                    }}
                    open={deleteTarget?.id === user.id}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        disabled={showForm || user.id === currentUser?.userId}
                        onClick={() => {
                          setDeleteTarget(user);
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
                        <AlertDialogTitle>{t("users.deleteUserTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("users.deleteUserDescription", { name: user.name, email: user.email })}
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {isLoading ? (
          <div className="flex items-center justify-center gap-3 border-t border-border/60 px-4 py-10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <span className="text-sm text-muted-foreground">{t("users.loadingUsers")}</span>
          </div>
        ) : null}

        {!isLoading && users.length === 0 && !showForm ? (
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
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-display text-sm font-medium text-foreground">{t("users.noUsersYet")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("users.noUsersDescription")}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default UsersPage;
