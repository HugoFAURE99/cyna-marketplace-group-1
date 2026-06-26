"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AuthMessage } from "@/components/connection/auth-message";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function PaymentForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = useTranslations("payment");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1000);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {success && (
                <AuthMessage variant="info">
                  {t("success")}
                </AuthMessage>
              )}

              <Field>
                <FieldSet className="border rounded-lg p-5">
                  <div className="mb-4">
                    <FieldLabel htmlFor="cardType">
                      {t("cardType")} *
                    </FieldLabel>
                    <Select defaultValue="visa" name="cardType">
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder={t("cardType")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visa">Visa</SelectItem>
                        <SelectItem value="mastercard">Mastercard</SelectItem>
                        <SelectItem value="amex">American Express</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="mb-4">
                    <FieldLabel htmlFor="cardNumber">
                      {t("cardNumber")} *
                    </FieldLabel>
                    <Input
                      id="cardNumber"
                      name="cardNumber"
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <FieldLabel htmlFor="cardHolderName">
                      {t("cardHolderName")} *
                    </FieldLabel>
                    <Input
                      id="cardHolderName"
                      name="cardHolderName"
                      type="text"
                      placeholder="Jean Dupont"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel htmlFor="expirationDate">
                        {t("expirationDate")} *
                      </FieldLabel>
                      <Input
                        id="expirationDate"
                        name="expirationDate"
                        type="text"
                        placeholder="MM/YY"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="cvv">
                        {t("cvv")} *
                      </FieldLabel>
                      <Input
                        id="cvv"
                        name="cvv"
                        type="text"
                        placeholder="123"
                        maxLength={4}
                        className="mt-1"
                        required
                      />
                    </div>
                  </div>
                </FieldSet>
              </Field>

              <Field>
                <Button variant="brand" type="submit" disabled={loading}>
                  {loading ? "..." : t("save")}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
