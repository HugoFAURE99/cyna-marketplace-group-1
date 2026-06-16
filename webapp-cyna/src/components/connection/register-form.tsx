import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardContent>
          <form>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Username *</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  placeholder="your username"
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Email *</FieldLabel>
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
                  <FieldLabel htmlFor="password">Password *</FieldLabel>
                  <Input id="password" type="password" required />
                  <FieldLabel htmlFor="password">Confirm Password *</FieldLabel>
                  <Input id="confirmPassword" type="password" required />
                </FieldSet>
              </Field>
              <Field>
                <Button type="submit">Create Account</Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
