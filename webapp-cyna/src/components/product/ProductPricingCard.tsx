"use client";

// Pricing card: pick a tariff + user count to compute a total.
// Subscribe is disabled until checkout is wired up.

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatPriceCents } from "@/lib/i18n/format";
import type { PublicProductTariff } from "@/lib/products/public-products";

type ProductPricingCardProps = {
  tariffs: PublicProductTariff[];
};

const USER_OPTIONS = Array.from({ length: 10 }, (_, index) => index + 1);
const DEFAULT_USER_COUNT = 5;

export default function ProductPricingCard({
  tariffs,
}: ProductPricingCardProps) {
  const t = useTranslations("product");
  const locale = useLocale();
  const [selectedTariffId, setSelectedTariffId] = useState(
    tariffs[0]?.id_prix ?? null,
  );
  const [userCount, setUserCount] = useState(DEFAULT_USER_COUNT);

  const selectedTariff = useMemo(
    () =>
      tariffs.find((tariff) => tariff.id_prix === selectedTariffId) ??
      tariffs[0],
    [selectedTariffId, tariffs],
  );

  const billingLabel = (type: string) => {
    switch (type) {
      case "mensuel":
        return t("billing.mensuel");
      case "annuel":
        return t("billing.annuel");
      case "unique":
        return t("billing.unique");
      default:
        return type;
    }
  };

  const periodSuffix = (type: string) => {
    if (type === "mensuel") return t("perMonth");
    if (type === "annuel") return t("perYear");
    return "";
  };

  const tariffLabel = (tariff: PublicProductTariff) =>
    tariff.nom_prix_tarif ?? billingLabel(tariff.type_facturation);

  // Total = unit price × number of users.
  const totalCents = selectedTariff ? selectedTariff.prix * userCount : 0;

  return (
    <section className="rounded-lg bg-white p-6 shadow-xs ring-1 ring-black/10">
      <h2 className="mb-5 text-lg font-semibold text-slate-950">
        {t("pricing")}
      </h2>

      {tariffs.length > 0 ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {tariffs.map((tariff) => {
              const isSelected = tariff.id_prix === selectedTariff?.id_prix;

              return (
                <button
                  aria-pressed={isSelected}
                  className={cn(
                    "rounded-lg border px-4 py-3 text-center transition",
                    isSelected
                      ? "border-purple-700 bg-purple-50 text-slate-950 ring-1 ring-purple-700"
                      : "border-slate-300 bg-white text-slate-950 hover:border-purple-300",
                  )}
                  key={tariff.id_prix}
                  onClick={() => setSelectedTariffId(tariff.id_prix)}
                  type="button"
                >
                  <span className="block text-base font-semibold">
                    {tariffLabel(tariff)}
                  </span>
                  <span className="block text-sm text-slate-600">
                    {formatPriceCents(tariff.prix, locale)}
                    {periodSuffix(tariff.type_facturation)}
                  </span>
                </button>
              );
            })}
          </div>

          <label
            className="mt-5 block text-sm font-medium text-slate-950"
            htmlFor="product-user-count"
          >
            {t("numberOfUsers")}
          </label>
          <Select
            onValueChange={(value) => setUserCount(Number(value))}
            value={String(userCount)}
          >
            <SelectTrigger className="mt-2 h-11 w-full" id="product-user-count">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {USER_OPTIONS.map((count) => (
                <SelectItem key={count} value={String(count)}>
                  {t("users", { count })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="mt-5 text-3xl font-bold text-slate-950">
            {formatPriceCents(totalCents, locale)}
            {selectedTariff ? periodSuffix(selectedTariff.type_facturation) : ""}
          </p>
        </>
      ) : (
        <p className="text-sm text-slate-600">{t("pricingUnavailable")}</p>
      )}

      <Button
        className="mt-5 h-12 w-full bg-purple-700 text-base font-semibold text-white hover:bg-purple-700 disabled:opacity-100"
        disabled
        type="button"
      >
        {t("subscribeNow")}
      </Button>
    </section>
  );
}
