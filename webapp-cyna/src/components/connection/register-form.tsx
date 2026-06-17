import { getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export async function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = await getTranslations("auth.register");

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardContent>
          <form>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">{t("username")} *</FieldLabel>
                <Input
                  id="username"
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
                    type="email"
                    placeholder="m@example.com"
                    required
                  />
                </div>
              </Field>
              <Field>
                <FieldSet className="border rounded-lg p-5">
                  <FieldLabel htmlFor="password">{t("password")} *</FieldLabel>
                  <Input id="password" type="password" required />
                  <FieldLabel htmlFor="confirmPassword">
                    {t("confirmPassword")} *
                  </FieldLabel>
                  <Input id="confirmPassword" type="password" required />
                </FieldSet>
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
