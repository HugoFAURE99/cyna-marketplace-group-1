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

import { resetPassword } from "@/app/(auth)/_action/auth.action";

type ResetState = {
  error?: string;
  errorKey?: string;
  successKey?: string;
} | null;

const initialState: ResetState = null;

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  // J'utilise "auth.resetPassword" pour les traductions
  const t = useTranslations("auth.resetPassword");
  const locale = useLocale();

  const [state, formAction, isPending] = useActionState<ResetState, FormData>(
    resetPassword.bind(null, locale),
    initialState
  );

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardContent>
          <form action={formAction}>
            <FieldGroup>
              {/* Message de succès */}
              {state?.successKey && (
                <AuthMessage variant="info">
                  {t(state.successKey as Parameters<typeof t>[0])}
                </AuthMessage>
              )}

              {/* Message d'erreur */}
              {(state?.errorKey || state?.error) && (
                <AuthMessage variant="error">
                  {state?.errorKey
                    ? t(state.errorKey as Parameters<typeof t>[0])
                    : state?.error}
                </AuthMessage>
              )}

              {/* On masque le champ email si le succès est là, c'est plus propre UX */}
              {!state?.successKey && (
                <>
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
                    <Button variant="brand" type="submit" disabled={isPending}>
                      {isPending ? t("loading") : t("submit")}
                    </Button>
                  </Field>
                </>
              )}

              <FieldDescription className="text-center">
                <Link
                  href="/login"
                  className="font-medium text-purple-700 underline-offset-4 hover:underline"
                >
                  {t("backToLogin")}
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
