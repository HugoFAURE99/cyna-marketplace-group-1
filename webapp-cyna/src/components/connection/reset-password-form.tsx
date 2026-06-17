import { getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export async function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = await getTranslations("auth.resetPassword");

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardContent>
          <form>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="password">{t("password")} *</FieldLabel>
                <Input id="password" type="password" required />
                <FieldLabel htmlFor="confirmPassword">
                  {t("confirmPassword")} *
                </FieldLabel>
                <Input id="confirmPassword" type="password" required />
              </Field>
              <Field>
                <Button type="submit">{t("submit")}</Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
