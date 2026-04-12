import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormErrors = {
  name?: string;
  form?: string;
};

async function readErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { error?: string; message?: string };
    return body.error ?? body.message ?? "Something went wrong. Please try again.";
  } catch {
    return "Something went wrong. Please try again.";
  }
}

function OrganizationSettingsPage() {
  const { t } = useTranslation();
  const [organizationName, setOrganizationName] = useState("");
  const [editName, setEditName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOrganization() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const response = await fetch("/api/organizations/current");

        if (!response.ok) {
          throw new Error(await readErrorMessage(response));
        }

        const data = (await response.json()) as { id: number; name: string };

        if (isMounted) {
          setOrganizationName(data.name);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : t("organizationSettings.loadError"),
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadOrganization();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleEditStart() {
    setEditName(organizationName);
    setFormErrors({});
    setSuccessMessage(null);
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setEditName("");
    setFormErrors({});
  }

  async function handleSave() {
    const trimmedName = editName.trim();

    if (trimmedName.length === 0) {
      setFormErrors({ name: t("validation.nameRequired") });
      return;
    }

    try {
      setIsSaving(true);
      setFormErrors({});

      const response = await fetch("/api/organizations/current/change-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (!response.ok) {
        const message = await readErrorMessage(response);
        setFormErrors({ form: message });
        return;
      }

      setOrganizationName(trimmedName);
      setIsEditing(false);
      setEditName("");
      setSuccessMessage(t("organizationSettings.updateSuccess"));
    } catch (error) {
      setFormErrors({
        form:
          error instanceof Error
            ? error.message
            : t("organizationSettings.saveError"),
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="font-display text-2xl font-bold tracking-tight">
          {t("organizationSettings.title")}
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          {t("organizationSettings.description")}
        </p>
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

      {isLoading ? (
        <div className="flex items-center gap-3 py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <span className="text-sm text-muted-foreground">
            {t("organizationSettings.loadingOrganization")}
          </span>
        </div>
      ) : null}

      {!isLoading && !loadError ? (
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="organization-name">
                {t("organizationSettings.organizationName")}
              </label>

              {isEditing ? (
                <div className="space-y-1.5">
                  <Input
                    aria-invalid={Boolean(formErrors.name)}
                    id="organization-name"
                    onChange={(event) => {
                      setEditName(event.target.value);
                      setFormErrors((currentErrors) => ({
                        ...currentErrors,
                        name: undefined,
                        form: undefined,
                      }));
                    }}
                    value={editName}
                  />
                  {formErrors.name ? (
                    <p className="text-xs text-destructive">{formErrors.name}</p>
                  ) : null}
                  {formErrors.form ? (
                    <p className="text-xs text-destructive">{formErrors.form}</p>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-foreground" data-testid="organization-name-display">
                  {organizationName}
                </p>
              )}
            </div>

            {successMessage ? (
              <div
                className="flex items-center gap-2.5 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-accent-foreground"
                role="status"
              >
                {successMessage}
              </div>
            ) : null}

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    disabled={isSaving}
                    onClick={() => void handleSave()}
                    size="sm"
                  >
                    {isSaving ? t("common.saving") : t("common.save")}
                  </Button>
                  <Button
                    disabled={isSaving}
                    onClick={handleCancelEdit}
                    size="sm"
                    variant="outline"
                  >
                    {t("common.cancel")}
                  </Button>
                </>
              ) : (
                <Button onClick={handleEditStart} size="sm">
                  {t("common.edit")}
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default OrganizationSettingsPage;
