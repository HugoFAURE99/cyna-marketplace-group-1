import { getTranslations } from "next-intl/server";

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

export async function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = await getTranslations("auth.login");

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardContent>
          <form>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">{t("email")} *</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">{t("password")} *</FieldLabel>
                <Input id="password" type="password" required />
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
                <Button type="submit">{t("submit")}</Button>
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
