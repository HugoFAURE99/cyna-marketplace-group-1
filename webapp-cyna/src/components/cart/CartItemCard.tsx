"use client";

// One editable cart line: billing period, quantity, unit price, line total, and
// a remove button. Each control calls a cart server action inside a transition;
// the action revalidates, so the server re-sends fresh totals and the header
// badge updates. Local quantity state is committed on blur / Enter.
import { useId, useState, useTransition } from "react";
import { ImageOff, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import AvailabilityBadge from "@/components/product/AvailabilityBadge";
import ContactSalesInfo from "@/components/product/ContactSalesInfo";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  removeCartLine,
  updateCartLineQuantity,
  updateCartLineTariff,
} from "@/lib/cart/cart.actions";
import type { CartViewItem } from "@/lib/cart/cart";
import { formatPriceCents } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/translations";
import type { PublicProductTariff } from "@/lib/products/public-products";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 99;

type CartItemCardProps = {
  item: CartViewItem;
};

export default function CartItemCard({ item }: CartItemCardProps) {
  const tc = useTranslations("cart");
  const tp = useTranslations("product");
  const locale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();
  const fieldId = useId();

  // Buffer the quantity locally; resync if the server sends a new value
  // (e.g. after a tariff switch merges two lines). Adjusting state during render
  // is React's recommended pattern for resetting on prop change.
  const [qtyInput, setQtyInput] = useState(String(item.quantity));
  const [syncedQty, setSyncedQty] = useState(item.quantity);
  if (syncedQty !== item.quantity) {
    setSyncedQty(item.quantity);
    setQtyInput(String(item.quantity));
  }

  const periodSuffix = (type: string) => {
    if (type === "mensuel") return tp("perMonth");
    if (type === "annuel") return tp("perYear");
    return "";
  };

  const billingLabel = (type: string) => {
    if (type === "mensuel") return tp("billing.mensuel");
    if (type === "annuel") return tp("billing.annuel");
    if (type === "unique") return tp("billing.unique");
    return type;
  };

  const tariffLabel = (tariff: PublicProductTariff) =>
    tariff.nom_prix_tarif ?? billingLabel(tariff.type_facturation);

  const commitQuantity = () => {
    const parsed = Number(qtyInput);
    const next = Number.isFinite(parsed)
      ? Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Math.trunc(parsed)))
      : item.quantity;
    setQtyInput(String(next));
    if (next === item.quantity) {
      return;
    }
    startTransition(async () => {
      await updateCartLineQuantity({
        productId: item.productId,
        tariffId: item.tariffId,
        quantity: next,
      });
    });
  };

  const handleTariffChange = (value: string | null) => {
    const next = Number(value);
    if (!value || !Number.isInteger(next) || next === item.tariffId) {
      return;
    }
    startTransition(async () => {
      await updateCartLineTariff({
        productId: item.productId,
        fromTariffId: item.tariffId,
        toTariffId: next,
      });
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      await removeCartLine({
        productId: item.productId,
        tariffId: item.tariffId,
      });
    });
  };

  return (
    <div
      aria-busy={isPending}
      className={cn(
        "rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition sm:p-5",
        isPending && "opacity-60",
      )}
    >
      <div className="flex gap-4">
        <Link
          className="block size-20 shrink-0 overflow-hidden rounded-md bg-slate-100 sm:size-24"
          href={`/products/${item.productId}`}
        >
          {item.imageUrl ? (
            <span
              aria-label={tp("imageAlt", { name: item.name })}
              className="block h-full w-full bg-cover bg-center"
              role="img"
              style={{
                backgroundImage: `url(${JSON.stringify(item.imageUrl)})`,
              }}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-slate-400">
              <ImageOff aria-hidden="true" className="size-7" />
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {item.categoryName && (
                <p className="truncate text-xs font-semibold uppercase tracking-wide text-purple-700">
                  {item.categoryName}
                </p>
              )}
              <h2 className="text-base font-semibold text-slate-950">
                <Link
                  className="rounded transition hover:text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700"
                  href={`/products/${item.productId}`}
                >
                  {item.name}
                </Link>
              </h2>
            </div>

            <button
              aria-label={tc("remove", { name: item.name })}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50"
              disabled={isPending}
              onClick={handleRemove}
              type="button"
            >
              <Trash2 aria-hidden="true" className="size-5" />
            </button>
          </div>

          {item.isUnavailable && (
            <div className="mt-2 flex items-center gap-2">
              <AvailabilityBadge label={tp("unavailable")} />
              <ContactSalesInfo />
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-3">
            <div className="space-y-1">
              <label
                className="block text-xs font-medium text-slate-500"
                htmlFor={`${fieldId}-billing`}
              >
                {tc("billingPeriod")}
              </label>
              <Select onValueChange={handleTariffChange} value={String(item.tariffId)}>
                <SelectTrigger
                  className="h-9 w-[150px]"
                  id={`${fieldId}-billing`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {item.tariffs.map((tariff) => (
                    <SelectItem key={tariff.id_prix} value={String(tariff.id_prix)}>
                      {tariffLabel(tariff)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label
                className="block text-xs font-medium text-slate-500"
                htmlFor={`${fieldId}-qty`}
              >
                {tc("quantity")}
              </label>
              <Input
                aria-label={tc("quantity")}
                className="h-9 w-20"
                id={`${fieldId}-qty`}
                inputMode="numeric"
                max={MAX_QUANTITY}
                min={MIN_QUANTITY}
                onBlur={commitQuantity}
                onChange={(event) => setQtyInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitQuantity();
                  }
                }}
                type="number"
                value={qtyInput}
              />
            </div>

            <div className="ml-auto text-right">
              <p className="text-xs text-slate-400">
                {formatPriceCents(item.unitPriceCents, locale)}
                {periodSuffix(item.typeFacturation)}
              </p>
              <p className="text-lg font-bold text-slate-950">
                {formatPriceCents(item.lineTotalCents, locale)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
