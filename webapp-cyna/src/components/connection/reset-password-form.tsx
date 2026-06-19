"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

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

  const [state, formAction, isPending] = useActionState<ResetState, FormData>(
    resetPassword,
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
                <div className="p-3 text-sm text-green-700 bg-green-100 rounded-md text-center">
                  {t(state.successKey as any)}
                </div>
              )}

              {/* Message d'erreur */}
              {(state?.errorKey || state?.error) && (
                <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md text-center">
                  {state?.errorKey ? t(state.errorKey as any) : state?.error}
                </div>
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
                    <Button type="submit" disabled={isPending}>
                      {isPending ? "Envoi..." : t("submit")}
                    </Button>
                  </Field>
                </>
              )}
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
