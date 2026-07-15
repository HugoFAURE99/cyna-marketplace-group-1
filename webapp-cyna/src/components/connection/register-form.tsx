"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AuthMessage } from "@/components/connection/auth-message";
import { Link } from "@/i18n/navigation";
import {
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  PASSWORD_RULES,
  type PasswordRuleId,
} from "@/lib/auth/password-policy";

import { register } from "@/app/(auth)/_action/auth.action";

type RegisterState = {
  error?: string; // Pour les erreurs brutes renvoyées par Supabase
  errorKey?: string; // Pour les clés de traduction personnalisées (mots de passe, etc.)
  values?: { username?: string; email?: string }; // Ré-affichées après une erreur
};

const initialState: RegisterState = {
  error: undefined,
  errorKey: undefined,
  values: undefined,
};

// Ordre d'affichage de la checklist de mot de passe. Les libellés viennent du JSON i18n.
const PASSWORD_REQUIREMENTS: { id: PasswordRuleId; labelKey: string }[] = [
  { id: "length", labelKey: "reqLength" },
  { id: "uppercase", labelKey: "reqUppercase" },
  { id: "lowercase", labelKey: "reqLowercase" },
  { id: "number", labelKey: "reqNumber" },
  { id: "special", labelKey: "reqSpecial" },
];

function RequirementItem({ met, label }: { met: boolean; label: string }) {
  return (
    <li
      className={cn(
        "flex items-center gap-2 text-xs transition-colors",
        met ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
      )}
    >
      {met ? (
        <Check className="size-3.5 shrink-0" aria-hidden />
      ) : (
        <X className="size-3.5 shrink-0" aria-hidden />
      )}
      <span>{label}</span>
    </li>
  );
}

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = useTranslations("auth.register");
  const locale = useLocale();

  const [state, formAction, isPending] = useActionState(
    register.bind(null, locale),
    initialState,
  );

  // Formulaire contrôlé : les valeurs survivent au re-render de l'action serveur
  // (plus de reset auto de React 19) et évitent l'avertissement Base UI sur defaultValue.
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const checks = {
    length: PASSWORD_RULES.length(password),
    uppercase: PASSWORD_RULES.uppercase(password),
    lowercase: PASSWORD_RULES.lowercase(password),
    number: PASSWORD_RULES.number(password),
    special: PASSWORD_RULES.special(password),
  };
  const passwordValid = Object.values(checks).every(Boolean);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const usernameValid =
    username.trim().length >= 1 && username.trim().length <= MAX_USERNAME_LENGTH;
  const emailValid = email.trim().length > 0;
  const canSubmit =
    !isPending && usernameValid && emailValid && passwordValid && passwordsMatch;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardContent>
          <form action={formAction}>
            <FieldGroup>
              {/* Affichage de l'erreur traduite OU de l'erreur brute système */}
              {(state?.errorKey || state?.error) && (
                <AuthMessage variant="error">
                  {state?.errorKey
                    ? t(state.errorKey as Parameters<typeof t>[0])
                    : state?.error}
                </AuthMessage>
              )}

              <Field>
                <FieldLabel htmlFor="username">{t("username")} *</FieldLabel>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={MAX_USERNAME_LENGTH}
                  required
                />
                <FieldDescription className="text-xs text-muted-foreground">
                  {t("usernameHint", { max: MAX_USERNAME_LENGTH })}
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="email">{t("email")} *</FieldLabel>
                <div className="flex items-center">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </Field>

              <Field>
                <FieldSet className="border rounded-lg p-5">
                  <FieldLabel htmlFor="password">{t("password")} *</FieldLabel>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      className="pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={MIN_PASSWORD_LENGTH}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" aria-hidden />
                      ) : (
                        <Eye className="size-4" aria-hidden />
                      )}
                    </button>
                  </div>

                  {/* Checklist de validité en temps réel */}
                  <ul className="mt-2 mb-4 grid gap-1">
                    {PASSWORD_REQUIREMENTS.map((req) => (
                      <RequirementItem
                        key={req.id}
                        met={checks[req.id]}
                        label={t(req.labelKey as Parameters<typeof t>[0])}
                      />
                    ))}
                  </ul>

                  <FieldLabel htmlFor="confirmPassword">
                    {t("confirmPassword")} *
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      className="pr-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={MIN_PASSWORD_LENGTH}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirm ? t("hidePassword") : t("showPassword")}
                      aria-pressed={showConfirm}
                    >
                      {showConfirm ? (
                        <EyeOff className="size-4" aria-hidden />
                      ) : (
                        <Eye className="size-4" aria-hidden />
                      )}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && (
                    <ul className="mt-2 grid gap-1">
                      <RequirementItem met={passwordsMatch} label={t("reqMatch")} />
                    </ul>
                  )}
                </FieldSet>
              </Field>

              <Field>
                <Button variant="brand" type="submit" disabled={!canSubmit}>
                  {isPending ? t("loading") : t("submit")}
                </Button>

                <FieldDescription className="text-center">
                  {t("haveAccount")}{" "}
                  <Link
                    href="/login"
                    className="font-medium text-purple-700 underline-offset-4 hover:underline"
                  >
                    {t("logIn")}
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
