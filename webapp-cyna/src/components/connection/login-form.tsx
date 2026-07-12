"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";

import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AuthMessage } from "@/components/connection/auth-message";

import { login } from "@/app/(auth)/_action/auth.action";
import { useSearchParams } from "next/navigation";

// 1. On ajoute errorKey pour gérer les traductions
type LoginState = {
  error?: string;
  errorKey?: string;
};

// 2. On met à jour l'état initial
const initialState: LoginState = {
  error: undefined,
  errorKey: undefined,
};

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = useTranslations("auth.login");
  const locale = useLocale();

  // 1. On récupère la valeur depuis l'URL
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  // 2. On "graft" (bind) l'argument 'next' à l'action originale.
  // Le premier paramètre est 'null' pour le contexte (this), le deuxième est notre variable.
  const loginWithNext = login.bind(null, locale, next);

  // 3. On donne cette action modifiée à useActionState
  const [state, formAction, isPending] = useActionState(
    loginWithNext,
    initialState
  );

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardContent>
          <form action={formAction}>
            <FieldGroup>
              {/* 3. Affichage de l'erreur traduite OU de l'erreur brute système */}
              {(state?.errorKey || state?.error) && (
                <AuthMessage variant="error">
                  {state?.errorKey
                    ? t(state.errorKey as Parameters<typeof t>[0])
                    : state?.error}
                </AuthMessage>
              )}

              <Field>
                <FieldLabel htmlFor="email">{t("email")} *</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">{t("password")} *</FieldLabel>
                <Input id="password" name="password" type="password" required />
                <div className="flex items-center">
                  <div className="ml-auto flex items-center gap-4">
                    <Link
                      href="/reset-password"
                      className="inline-block text-sm font-medium text-purple-700 underline-offset-4 hover:underline"
                    >
                      {t("forgotPassword")}
                    </Link>
                  </div>
                </div>
              </Field>
              {/* Nouvelle case : Se souvenir de moi */}
              <Field>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    name="remember"
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600"
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    {t("rememberMe")}
                  </label>
                </div>
              </Field>
              <Field>
                <Button variant="brand" type="submit" disabled={isPending}>
                  {isPending ? t("loading") : t("submit")}
                </Button>

                <FieldDescription className="text-center">
                  {t("noAccount")}{" "}
                  <Link
                    href="/register"
                    className="font-medium text-purple-700 underline-offset-4 hover:underline"
                  >
                    {t("createAccount")}
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
