"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";

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

import { register } from "@/app/(auth)/_action/auth.action";

type RegisterState = {
  error?: string; // Pour les erreurs brutes renvoyées par Supabase
  errorKey?: string; // Pour les clés de traduction personnalisées (mots de passe, etc.)
};

const initialState: RegisterState = {
  error: undefined,
  errorKey: undefined,
};

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
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="email">{t("email")} *</FieldLabel>
                <div className="flex items-center">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                  />
                </div>
              </Field>

              <Field>
                <FieldSet className="border rounded-lg p-5">
                  <FieldLabel htmlFor="password">{t("password")} *</FieldLabel>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                  />

                  {/* Affichage textuel de la consigne traduit depuis le JSON */}
                  <FieldDescription className="text-xs text-muted-foreground mt-1 mb-4">
                    {t("passwordRequirements")}
                  </FieldDescription>

                  <FieldLabel htmlFor="confirmPassword">
                    {t("confirmPassword")} *
                  </FieldLabel>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                  />
                </FieldSet>
              </Field>

              <Field>
                <Button variant="brand" type="submit" disabled={isPending}>
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
