import { type ChangeEvent, type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/store/AuthContext";

type SigninFormValues = {
  email: string;
  password: string;
};

type SigninFormErrors = Partial<Record<keyof SigninFormValues, string>> & {
  form?: string;
};

const initialFormValues: SigninFormValues = {
  email: "",
  password: "",
};

function normalizeFormValues(values: SigninFormValues) {
  return {
    email: values.email.trim().toLowerCase(),
    password: values.password,
  };
}

function validateForm(values: SigninFormValues, t: (key: string) => string): SigninFormErrors {
  const normalizedValues = normalizeFormValues(values);
  const errors: SigninFormErrors = {};

  if (normalizedValues.email.length === 0) {
    errors.email = t("validation.emailRequired");
  }

  if (normalizedValues.password.length === 0) {
    errors.password = t("validation.passwordRequired");
  }

  return errors;
}

function SigninPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signin } = useAuth();
  const [formValues, setFormValues] = useState(initialFormValues);
  const [formErrors, setFormErrors] = useState<SigninFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof SigninFormValues, value: string) {
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
      await signin(normalizedValues.email, normalizedValues.password);
      navigate("/", { replace: true });
    } catch (error) {
      setFormErrors({
        form:
          error instanceof Error
            ? error.message
            : t("signin.invalidCredentials"),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(32,156,255,0.14),transparent_34%),linear-gradient(180deg,rgba(248,250,252,1),rgba(255,255,255,0.96))] px-6 py-16 text-foreground dark:bg-[radial-gradient(circle_at_top_right,rgba(32,156,255,0.1),transparent_34%),linear-gradient(180deg,hsl(215_25%_9%),hsl(215_25%_9%))]">
      <section className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[28px] border border-border/70 bg-card/95 p-8 shadow-soft sm:p-10">
          <div className="mb-8 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              {t("signin.badge")}
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {t("signin.title")}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("signin.subtitle")}
            </p>
          </div>

          <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
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
                placeholder={t("signin.emailPlaceholder")}
                type="email"
                value={formValues.email}
              />
              {formErrors.email ? (
                <p className="text-xs text-destructive">{formErrors.email}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                {t("common.password")}
              </label>
              <Input
                aria-invalid={Boolean(formErrors.password)}
                autoComplete="current-password"
                id="password"
                name="password"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateField("password", event.target.value)
                }
                placeholder={t("signin.passwordPlaceholder")}
                type="password"
                value={formValues.password}
              />
              {formErrors.password ? (
                <p className="text-xs text-destructive">{formErrors.password}</p>
              ) : null}
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
              {isSubmitting ? t("signin.submitting") : t("signin.submit")}
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            {t("signin.createOrganization")}{" "}
            <Link className="font-semibold text-primary hover:text-primary/80" to="/signup">
              {t("signin.here")}
            </Link>
            .
          </p>
        </div>

        <div className="hidden rounded-[28px] border border-primary/20 bg-[linear-gradient(160deg,rgba(32,156,255,0.12),rgba(255,255,255,0.9)_42%,rgba(104,224,207,0.06))] px-10 py-12 shadow-soft dark:bg-[linear-gradient(160deg,rgba(32,156,255,0.1),hsl(215_25%_12%)_42%,rgba(104,224,207,0.04))] lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            {t("signin.secureBadge")}
          </div>
          <h2 className="mt-6 max-w-md font-display text-4xl font-bold tracking-tight text-foreground">
            {t("signin.secureTitle")}
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground">
            {t("signin.secureDescription")}
          </p>
        </div>
      </section>
    </main>
  );
}

export default SigninPage;
