"use client";

// One editable cart line: billing period, license users, unit price, line total, and
// a remove button. Each control calls a cart server action inside a transition;
// the action revalidates, so the server re-sends fresh totals and the header
// badge updates. Local user-count state is committed on blur / Enter.
import {
  useCallback,
  useId,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from "react";
import { ImageOff, Minus, Plus, Trash2 } from "lucide-react";
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
  updateCartLineUserCount,
  updateCartLineTariff,
} from "@/lib/cart/cart.actions";
import { useRepeatingPress } from "@/hooks/use-repeating-press";
import type { CartViewItem } from "@/lib/cart/cart";
import {
  MAX_LICENSE_USERS,
  MIN_LICENSE_USERS,
} from "@/lib/cart/cart-constants";
import { formatPriceCents } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/translations";
import type { PublicProductTariff } from "@/lib/products/public-products";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type CartItemCardProps = {
  item: CartViewItem;
};

function clampUserCount(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(
    MAX_LICENSE_USERS,
    Math.max(MIN_LICENSE_USERS, Math.trunc(value)),
  );
}

export default function CartItemCard({ item }: CartItemCardProps) {
  const tc = useTranslations("cart");
  const tp = useTranslations("product");
  const locale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();
  const fieldId = useId();
  const draftUserCountRef = useRef(item.licenseUserCount);

  // Buffer the user count locally; resync if the server sends a new value
  // (e.g. after a tariff switch merges two lines). Adjusting state during render
  // is React's recommended pattern for resetting on prop change.
  const [usersInput, setUsersInput] = useState(
    String(item.licenseUserCount),
  );
  const [syncedUsers, setSyncedUsers] = useState(item.licenseUserCount);
  if (syncedUsers !== item.licenseUserCount) {
    setSyncedUsers(item.licenseUserCount);
    draftUserCountRef.current = item.licenseUserCount;
    setUsersInput(String(item.licenseUserCount));
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
  const tariffLabels = new Map(
    item.tariffs.map(
      (tariff) => [String(tariff.id_prix), tariffLabel(tariff)] as const,
    ),
  );

  const setDraftUserCount = useCallback(
    (value: number, fallback = item.licenseUserCount) => {
      const next = clampUserCount(value, fallback);
      draftUserCountRef.current = next;
      setUsersInput(String(next));
      return next;
    },
    [item.licenseUserCount],
  );

  const commitUserCount = useCallback(
    (value = draftUserCountRef.current) => {
      const next = setDraftUserCount(value);
      if (next === item.licenseUserCount) {
        return;
      }
      startTransition(async () => {
        await updateCartLineUserCount({
          productId: item.productId,
          tariffId: item.tariffId,
          licenseUserCount: next,
        });
      });
    },
    [
      item.licenseUserCount,
      item.productId,
      item.tariffId,
      setDraftUserCount,
      startTransition,
    ],
  );

  const stepDraftUserCount = useCallback(
    (delta: number) => {
      setDraftUserCount(draftUserCountRef.current + delta);
    },
    [setDraftUserCount],
  );

  const decreasePress = useRepeatingPress(
    () => stepDraftUserCount(-1),
    () => commitUserCount(),
  );
  const increasePress = useRepeatingPress(
    () => stepDraftUserCount(1),
    () => commitUserCount(),
  );
  const draftUserCount = clampUserCount(
    Number(usersInput),
    item.licenseUserCount,
  );

  const handleStepKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    delta: number,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      stepDraftUserCount(delta);
      commitUserCount(draftUserCountRef.current);
    }
  };

  const commitInputUserCount = () => {
    const parsed = Number(usersInput);
    const next = Number.isFinite(parsed)
      ? parsed
      : draftUserCountRef.current;
    commitUserCount(next);
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
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-slate-600 transition hover:bg-purple-50 hover:text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 disabled:opacity-50"
              disabled={isPending}
              onClick={handleRemove}
              type="button"
            >
              <Trash2 aria-hidden="true" className="size-5" />
            </button>
          </div>

          {item.isUnavailable && (
            <div className="mt-2 space-y-2">
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
                  className="h-9 w-[132px]"
                  id={`${fieldId}-billing`}
                >
                  <SelectValue>
                    {(value) => tariffLabels.get(String(value)) ?? ""}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {item.tariffs.map((tariff) => (
                    <SelectItem
                      key={tariff.id_prix}
                      label={tariffLabel(tariff)}
                      value={String(tariff.id_prix)}
                    >
                      {tariffLabel(tariff)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label
                className="block text-xs font-medium text-slate-500"
                htmlFor={`${fieldId}-users`}
              >
                {tc("licenseUsers")}
              </label>
              <div className="flex h-9 items-center overflow-hidden rounded-md border border-input bg-white shadow-xs">
                <button
                  aria-label={tc("decreaseLicenseUsers")}
                  className="inline-flex h-full w-9 items-center justify-center text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={isPending || draftUserCount <= MIN_LICENSE_USERS}
                  onKeyDown={(event) => handleStepKeyDown(event, -1)}
                  type="button"
                  {...decreasePress}
                >
                  <Minus aria-hidden="true" className="size-4" />
                </button>
                <Input
                  aria-label={tc("licenseUsers")}
                  className="h-8 w-14 rounded-none border-0 px-1 text-center shadow-none focus-visible:border-transparent focus-visible:ring-0"
                  id={`${fieldId}-users`}
                  inputMode="numeric"
                  max={MAX_LICENSE_USERS}
                  min={MIN_LICENSE_USERS}
                  onBlur={commitInputUserCount}
                  onChange={(event) => {
                    setUsersInput(event.target.value);
                    const parsed = Number(event.target.value);
                    if (Number.isFinite(parsed)) {
                      draftUserCountRef.current = clampUserCount(
                        parsed,
                        draftUserCountRef.current,
                      );
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      commitInputUserCount();
                    }
                  }}
                  pattern="[0-9]*"
                  type="text"
                  value={usersInput}
                />
                <button
                  aria-label={tc("increaseLicenseUsers")}
                  className="inline-flex h-full w-9 items-center justify-center text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={isPending || draftUserCount >= MAX_LICENSE_USERS}
                  onKeyDown={(event) => handleStepKeyDown(event, 1)}
                  type="button"
                  {...increasePress}
                >
                  <Plus aria-hidden="true" className="size-4" />
                </button>
              </div>
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
