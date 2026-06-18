"use client";

import { useTranslations } from "next-intl";
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

import { login } from "@/app/(auth)/_action/auth.action";

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

  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardContent>
          <form action={formAction}>
            <FieldGroup>
              {/* 3. Affichage de l'erreur traduite OU de l'erreur brute système */}
              {(state?.errorKey || state?.error) && (
                <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md text-center">
                  {state?.errorKey ? t(state.errorKey as any) : state?.error}
                </div>
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
                      className="inline-block text-sm underline-offset-4 hover:underline"
                    >
                      {t("forgotPassword")}
                    </Link>
                  </div>
                </div>
              </Field>

              <Field>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Connexion..." : t("submit")}
                </Button>

                <FieldDescription className="text-center">
                  {t("noAccount")}{" "}
                  <Link href="/register">{t("createAccount")}</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
