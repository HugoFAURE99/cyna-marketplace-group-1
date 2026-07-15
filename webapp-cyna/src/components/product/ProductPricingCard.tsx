"use client";

// Pricing card: pick a tariff + license user count to compute a total.
// Subscribe is disabled until checkout is wired up.

import {
  useCallback,
  useMemo,
  useState,
  useTransition,
  type KeyboardEvent,
} from "react";
import { CreditCard, Loader2, Minus, Plus, ShoppingCart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import GuestCheckoutDialog from "@/components/checkout/GuestCheckoutDialog";
import { Input } from "@/components/ui/input";
import PromotionalPrice from "@/components/product/PromotionalPrice";
import { useRepeatingPress } from "@/hooks/use-repeating-press";
import { addToCart } from "@/lib/cart/cart.actions";
import { processBuyNow } from "@/lib/checkout/checkout.action";
import {
  DEFAULT_LICENSE_USERS,
  MAX_LICENSE_USERS,
  MIN_LICENSE_USERS,
} from "@/lib/cart/cart-constants";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/translations";
import type { PublicProductTariff } from "@/lib/products/public-products";
import { calculatePromotionalPriceCents } from "@/lib/promotions/automatic-promotion";
import { useNotification } from "@/components/ui/notification-provider";

type ProductPricingCardProps = {
  productId: number;
  productName: string;
  isUnavailable: boolean;
  tariffs: PublicProductTariff[];
  initialTariffId?: number;
  initialUserCount?: number;
  isGuest: boolean;
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

export default function ProductPricingCard({
  productId,
  productName,
  isUnavailable,
  tariffs,
  initialTariffId,
  initialUserCount,
  isGuest,
}: ProductPricingCardProps) {
  const t = useTranslations("product");
  const { notify } = useNotification();
  const locale = useLocale() as Locale;
  const restoredTariffId = tariffs.some(
    (tariff) => tariff.id_prix === initialTariffId,
  )
    ? initialTariffId
    : tariffs[0]?.id_prix;
  const restoredUserCount = clampUserCount(
    initialUserCount ?? DEFAULT_LICENSE_USERS,
    DEFAULT_LICENSE_USERS,
  );
  const [selectedTariffId, setSelectedTariffId] = useState(
    restoredTariffId ?? null,
  );
  const [userCount, setUserCount] = useState(restoredUserCount);
  const [userInput, setUserInput] = useState(String(restoredUserCount));
  const [pendingAction, setPendingAction] = useState<"cart" | "buy" | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);

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

  const originalTotalCents = selectedTariff
    ? selectedTariff.prix * userCount
    : 0;
  const totalCents = selectedTariff
    ? calculatePromotionalPriceCents(
        originalTotalCents,
        selectedTariff.automaticPromotion,
      )
    : 0;

  const commitUserCount = (value = Number(userInput)) => {
    const next = clampUserCount(value, userCount);
    setUserCount(next);
    setUserInput(String(next));
  };

  const stepUserCount = useCallback((delta: number) => {
    setUserCount((current) => {
      const next = clampUserCount(current + delta, current);
      setUserInput(String(next));
      return next;
    });
  }, []);

  const decreasePress = useRepeatingPress(() => stepUserCount(-1));
  const increasePress = useRepeatingPress(() => stepUserCount(1));

  const handleStepKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    delta: number,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      stepUserCount(delta);
    }
  };

  const handleAddToCart = () => {
    if (!selectedTariff) {
      return;
    }
    setPendingAction("cart");
    startTransition(async () => {
      try {
        await addToCart({
          productId,
          tariffId: selectedTariff.id_prix,
          licenseUserCount: userCount,
        });
        notify(t("addedToCartNotification", { name: productName }));
      } finally {
        setPendingAction(null);
      }
    });
  };

  const startBuyNow = () => {
    if (!selectedTariff) return;
    setPendingAction("buy");
    startTransition(async () => {
      try {
        const result = await processBuyNow({
          locale,
          productId,
          tariffId: selectedTariff.id_prix,
          licenseUserCount: userCount,
        });
        // DEBUG TEMPORAIRE
        if (result && "debugError" in result && result.debugError) {
          alert(`DEBUG buy-now: ${result.debugError}`);
          setPendingAction(null);
          return;
        }
        if (result && "url" in result && result.url) {
          window.location.assign(result.url);
        }
      } catch (error) {
        console.error("[buy-now] Checkout failed", error);
        notify(t("buyNowError"), { kind: "error" });
        setPendingAction(null);
      }
    });
  };

  const handleBuyNow = () => {
    if (isGuest) {
      setGuestDialogOpen(true);
      return;
    }

    startBuyNow();
  };

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
                    "cursor-pointer rounded-lg border px-4 py-3 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 active:bg-purple-100",
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
                  <PromotionalPrice
                    automaticPromotion={tariff.automaticPromotion}
                    badgeLabel={(discount) =>
                      t("promotionBadge", { discount })
                    }
                    className="mt-1 justify-center text-sm"
                    locale={locale}
                    originalPriceCents={tariff.prix}
                    periodSuffix={periodSuffix(tariff.type_facturation)}
                    promotionalPriceCents={tariff.promotionalPriceCents}
                  />
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
          <div className="mt-2 flex h-11 w-full items-center overflow-hidden rounded-md border border-input bg-white shadow-xs">
            <button
              aria-label={t("decreaseUsers")}
              className="inline-flex h-full w-11 cursor-pointer items-center justify-center text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={userCount <= MIN_LICENSE_USERS}
              onKeyDown={(event) => handleStepKeyDown(event, -1)}
              type="button"
              {...decreasePress}
            >
              <Minus aria-hidden="true" className="size-4" />
            </button>
            <Input
              aria-label={t("numberOfUsers")}
              className="h-10 min-w-0 flex-1 rounded-none border-0 px-1 text-center shadow-none focus-visible:border-transparent focus-visible:ring-0"
              id="product-user-count"
              inputMode="numeric"
              max={MAX_LICENSE_USERS}
              min={MIN_LICENSE_USERS}
              onBlur={() => commitUserCount()}
              onChange={(event) => {
                setUserInput(event.target.value);
                const parsed = Number(event.target.value);
                if (Number.isFinite(parsed)) {
                  setUserCount(clampUserCount(parsed, DEFAULT_LICENSE_USERS));
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitUserCount();
                }
              }}
              pattern="[0-9]*"
              type="text"
              value={userInput}
            />
            <button
              aria-label={t("increaseUsers")}
              className="inline-flex h-full w-11 cursor-pointer items-center justify-center text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={userCount >= MAX_LICENSE_USERS}
              onKeyDown={(event) => handleStepKeyDown(event, 1)}
              type="button"
              {...increasePress}
            >
              <Plus aria-hidden="true" className="size-4" />
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {t("users", { count: userCount })}
          </p>

          {selectedTariff ? (
            <PromotionalPrice
              automaticPromotion={selectedTariff.automaticPromotion}
              badgeLabel={(discount) =>
                t("promotionBadge", { discount })
              }
              className="mt-5"
              locale={locale}
              originalPriceCents={originalTotalCents}
              periodSuffix={periodSuffix(selectedTariff.type_facturation)}
              priceClassName="text-3xl text-slate-950"
              promotionalPriceCents={totalCents}
            />
          ) : null}
        </>
      ) : (
        <p className="text-sm text-slate-600">{t("pricingUnavailable")}</p>
      )}

      {isUnavailable ? (
        <Button
          className="mt-5 h-12 w-full bg-slate-200 text-base font-semibold text-slate-500 hover:bg-slate-200 disabled:opacity-100"
          disabled
          type="button"
        >
          {t("currentlyUnavailable")}
        </Button>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <Button
            className="h-12 w-full bg-purple-700 text-base font-semibold text-white transition hover:bg-purple-800 disabled:opacity-70"
            disabled={!selectedTariff || isPending}
            onClick={handleBuyNow}
            type="button"
          >
            {pendingAction === "buy" ? (
              <Loader2 aria-hidden="true" className="size-5 animate-spin" />
            ) : (
              <CreditCard aria-hidden="true" className="size-5" />
            )}
            {pendingAction === "buy" ? t("redirecting") : t("buyNow")}
          </Button>
          <Button
            className="h-12 w-full border-purple-200 bg-white text-base font-semibold text-purple-800 transition hover:bg-purple-50 disabled:opacity-70"
            disabled={!selectedTariff || isPending}
            onClick={handleAddToCart}
            type="button"
            variant="outline"
          >
            {pendingAction === "cart" ? (
              <Loader2 aria-hidden="true" className="size-5 animate-spin" />
            ) : (
              <ShoppingCart aria-hidden="true" className="size-5" />
            )}
            {t("addToCart")}
          </Button>
        </div>
      )}
      <GuestCheckoutDialog
        isPending={isPending && pendingAction === "buy"}
        onConfirm={startBuyNow}
        onOpenChange={setGuestDialogOpen}
        open={guestDialogOpen}
        returnPath={`/products/${productId}?tariff=${selectedTariffId ?? ""}&seats=${userCount}`}
      />
    </section>
  );
}
