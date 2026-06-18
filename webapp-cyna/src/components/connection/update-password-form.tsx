"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { updatePassword } from "@/app/(auth)/_action/auth.action";

type UpdateState = {
  error?: string;
  errorKey?: string;
} | null;

const initialState: UpdateState = null;

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  // J'utilise "auth.updatePassword" pour l'isoler du reste
  const t = useTranslations("auth.updatePassword");

  const [state, formAction, isPending] = useActionState<UpdateState, FormData>(
    updatePassword,
    initialState
  );

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardContent>
          <form action={formAction}>
            <FieldGroup>
              {(state?.errorKey || state?.error) && (
                <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md text-center">
                  {state?.errorKey ? t(state.errorKey as any) : state?.error}
                </div>
              )}

              <Field>
                <FieldSet className="border rounded-lg p-5">
                  <FieldLabel htmlFor="password">
                    {t("newPassword")} *
                  </FieldLabel>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                  />

                  {/* On rappelle les règles de sécu ici aussi ! */}
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
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Mise à jour..." : t("submit")}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
