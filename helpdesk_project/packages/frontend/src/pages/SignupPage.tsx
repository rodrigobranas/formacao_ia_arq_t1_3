import { type ChangeEvent, type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PASSWORD_MIN_LENGTH = 8;

type SignupFormValues = {
  organizationName: string;
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
};

type SignupFormErrors = Partial<Record<keyof SignupFormValues, string>> & {
  form?: string;
};

const initialFormValues: SignupFormValues = {
  organizationName: "",
  name: "",
  email: "",
  password: "",
  passwordConfirmation: "",
};

function normalizeFormValues(values: SignupFormValues) {
  return {
    organizationName: values.organizationName.trim(),
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    password: values.password,
    passwordConfirmation: values.passwordConfirmation,
  };
}

function validateForm(values: SignupFormValues, t: (key: string) => string): SignupFormErrors {
  const normalizedValues = normalizeFormValues(values);
  const errors: SignupFormErrors = {};

  if (normalizedValues.organizationName.length === 0) {
    errors.organizationName = t("validation.organizationNameRequired");
  }

  if (normalizedValues.name.length === 0) {
    errors.name = t("validation.nameRequired");
  }

  if (normalizedValues.email.length === 0) {
    errors.email = t("validation.emailRequired");
  }

  if (normalizedValues.password.length === 0) {
    errors.password = t("validation.passwordRequired");
  } else if (normalizedValues.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = t("validation.passwordMinLength");
  }

  if (normalizedValues.passwordConfirmation.length === 0) {
    errors.passwordConfirmation = t("validation.passwordConfirmationRequired");
  } else if (normalizedValues.password !== normalizedValues.passwordConfirmation) {
    errors.passwordConfirmation = t("validation.passwordsDoNotMatch");
  }

  return errors;
}

async function readErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { error?: string; message?: string };
    return body.error ?? body.message ?? "Unable to create your organization.";
  } catch {
    return "Unable to create your organization.";
  }
}

function mapServerError(message: string): SignupFormErrors {
  if (/^organization name /i.test(message)) {
    return { organizationName: message };
  }

  if (/^name /i.test(message)) {
    return { name: message };
  }

  if (/^email /i.test(message)) {
    return { email: message };
  }

  if (/^password /i.test(message)) {
    return { password: message };
  }

  return { form: message };
}

function SignupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(initialFormValues);
  const [formErrors, setFormErrors] = useState<SignupFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof SignupFormValues, value: string) {
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateForm(formValues, t);

    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    const normalizedValues = normalizeFormValues(formValues);

    try {
      setIsSubmitting(true);
      setFormErrors({});

      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationName: normalizedValues.organizationName,
          name: normalizedValues.name,
          email: normalizedValues.email,
          password: normalizedValues.password,
        }),
      });

      if (!response.ok) {
        setFormErrors(mapServerError(await readErrorMessage(response)));
        return;
      }

      navigate("/signin", { replace: true });
    } catch (error) {
      setFormErrors({
        form:
          error instanceof Error
            ? error.message
            : t("signup.unableToCreate"),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderFieldError(field: keyof SignupFormValues) {
    if (!formErrors[field]) {
      return null;
    }

    return <p className="text-xs text-destructive">{formErrors[field]}</p>;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(32,156,255,0.12),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,1))] px-6 py-16 text-foreground dark:bg-[radial-gradient(circle_at_top,rgba(32,156,255,0.08),transparent_35%),linear-gradient(180deg,hsl(215_25%_9%),hsl(215_25%_9%))]">
      <section className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden rounded-[28px] border border-primary/20 bg-[linear-gradient(160deg,rgba(32,156,255,0.08),hsl(215_25%_10%)_42%,rgba(104,224,207,0.06))] px-10 py-12 text-foreground shadow-soft dark:border-primary/15 lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            {t("signup.workspaceBadge")}
          </div>
          <h1 className="mt-6 max-w-md font-display text-4xl font-bold tracking-tight text-white">
            {t("signup.workspaceTitle")}
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-white/70">
            {t("signup.workspaceDescription")}
          </p>
        </div>

        <div className="rounded-[28px] border border-border/70 bg-card/95 p-8 shadow-soft sm:p-10">
          <div className="mb-8 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              {t("signup.badge")}
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {t("signup.title")}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("signup.subtitle")}
            </p>
          </div>

          <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="organizationName">
                {t("signup.organizationNameLabel")}
              </label>
              <Input
                aria-invalid={Boolean(formErrors.organizationName)}
                id="organizationName"
                name="organizationName"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateField("organizationName", event.target.value)
                }
                placeholder={t("signup.organizationNamePlaceholder")}
                value={formValues.organizationName}
              />
              {renderFieldError("organizationName")}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="name">
                {t("signup.adminNameLabel")}
              </label>
              <Input
                aria-invalid={Boolean(formErrors.name)}
                id="name"
                name="name"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateField("name", event.target.value)
                }
                placeholder={t("signup.adminNamePlaceholder")}
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
                autoComplete="email"
                id="email"
                name="email"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateField("email", event.target.value)
                }
                placeholder={t("signup.emailPlaceholder")}
                type="email"
                value={formValues.email}
              />
              {renderFieldError("email")}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                {t("common.password")}
              </label>
              <Input
                aria-invalid={Boolean(formErrors.password)}
                autoComplete="new-password"
                id="password"
                name="password"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateField("password", event.target.value)
                }
                placeholder={t("signup.passwordPlaceholder")}
                type="password"
                value={formValues.password}
              />
              {renderFieldError("password")}
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="passwordConfirmation"
              >
                {t("signup.confirmPasswordLabel")}
              </label>
              <Input
                aria-invalid={Boolean(formErrors.passwordConfirmation)}
                autoComplete="new-password"
                id="passwordConfirmation"
                name="passwordConfirmation"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateField("passwordConfirmation", event.target.value)
                }
                placeholder={t("signup.confirmPasswordPlaceholder")}
                type="password"
                value={formValues.passwordConfirmation}
              />
              {renderFieldError("passwordConfirmation")}
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
              {isSubmitting ? t("signup.submitting") : t("signup.submit")}
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            {t("signup.alreadyHaveAccount")}{" "}
            <Link className="font-semibold text-primary hover:text-primary/80" to="/signin">
              {t("signup.signIn")}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default SignupPage;
