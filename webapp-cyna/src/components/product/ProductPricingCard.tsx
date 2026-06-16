"use client";

// Pricing card: pick a tariff + user count to compute a total.
// Subscribe is disabled until checkout is wired up.

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PublicProductTariff } from "@/lib/products/public-products";

type ProductPricingCardProps = {
  tariffs: PublicProductTariff[];
};

const USER_OPTIONS = Array.from({ length: 10 }, (_, index) => index + 1);
const DEFAULT_USER_COUNT = 5;

export default function ProductPricingCard({
  tariffs,
}: ProductPricingCardProps) {
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

  // Total = unit price × number of users.
  const totalCents = selectedTariff ? selectedTariff.prix * userCount : 0;
  const periodSuffix = selectedTariff
    ? getTotalPeriodSuffix(selectedTariff.type_facturation)
    : "";

  return (
    <section className="rounded-lg bg-white p-6 shadow-xs ring-1 ring-black/10">
      <h2 className="mb-5 text-lg font-semibold text-slate-950">Pricing</h2>

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
                    {getTariffLabel(tariff)}
                  </span>
                  <span className="block text-sm text-slate-600">
                    {formatEuroCents(tariff.prix)}
                    {getTariffPeriodSuffix(tariff.type_facturation)}
                  </span>
                </button>
              );
            })}
          </div>

          <label
            className="mt-5 block text-sm font-medium text-slate-950"
            htmlFor="product-user-count"
          >
            Number of Users
          </label>
          <Select
            onValueChange={(value) => setUserCount(Number(value))}
            value={String(userCount)}
          >
            <SelectTrigger
              className="mt-2 h-11 w-full"
              id="product-user-count"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {USER_OPTIONS.map((count) => (
                <SelectItem key={count} value={String(count)}>
                  {count} {count === 1 ? "user" : "users"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="mt-5 text-3xl font-bold text-slate-950">
            {formatEuroCents(totalCents)}
            {periodSuffix}
          </p>
        </>
      ) : (
        <p className="text-sm text-slate-600">Pricing unavailable</p>
      )}

      <Button
        className="mt-5 h-12 w-full bg-purple-700 text-base font-semibold text-white hover:bg-purple-700 disabled:opacity-100"
        disabled
        type="button"
      >
        Subscribe Now
      </Button>
    </section>
  );
}

function getTariffLabel(tariff: PublicProductTariff) {
  if (tariff.nom_prix_tarif) {
    return tariff.nom_prix_tarif;
  }

  switch (tariff.type_facturation) {
    case "mensuel":
      return "Monthly";
    case "annuel":
      return "Annual";
    case "unique":
      return "One-time";
    default:
      return tariff.type_facturation;
  }
}

function getTariffPeriodSuffix(type: string) {
  switch (type) {
    case "mensuel":
      return "/mo";
    case "annuel":
      return "/yr";
    default:
      return "";
  }
}

function getTotalPeriodSuffix(type: string) {
  const tariffSuffix = getTariffPeriodSuffix(type);

  return tariffSuffix ? tariffSuffix : "";
}

function formatEuroCents(cents: number) {
  const amount = cents / 100;
  const hasCents = cents % 100 !== 0;

  return `\u20ac${amount.toLocaleString("en-US", {
    maximumFractionDigits: hasCents ? 2 : 0,
    minimumFractionDigits: hasCents ? 2 : 0,
  })}`;
}
