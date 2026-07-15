"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, AlertCircle } from "lucide-react";

import PromotionalPrice from "@/components/product/PromotionalPrice";
import GuestCheckoutDialog from "@/components/checkout/GuestCheckoutDialog";
import { processCheckout } from "@/lib/checkout/checkout.action";
import type { Locale } from "@/lib/i18n/translations";
import type { AutomaticPromotion } from "@/lib/promotions/automatic-promotion";

type CheckoutSummaryProps = {
  automaticPromotion: AutomaticPromotion | null;
  subtotalCents: number;
  originalSubtotalCents: number;
  hasMixedIntervals: boolean;
  isGuest: boolean;
};

export default function CheckoutSummary({
  automaticPromotion,
  subtotalCents,
  originalSubtotalCents,
  hasMixedIntervals,
  isGuest,
}: CheckoutSummaryProps) {
  const t = useTranslations("cart");
  const tp = useTranslations("product");
  const locale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);

  const startCheckout = () => {
    startTransition(async () => {
      try {
        // 👇 On récupère le résultat de l'action
        const result = await processCheckout(locale);

        // DEBUG TEMPORAIRE
        if (result && "debugError" in result && result.debugError) {
          alert(`DEBUG checkout: ${result.debugError}`);
          return;
        }

        // 👇 Si on a bien reçu une URL, on redirige l'utilisateur vers Stripe
        if (result && "url" in result && result.url) {
          window.location.href = result.url;
        }
      } catch (error) {
        console.error("Erreur de paiement:", error);
        alert(t("checkoutError"));
      }
    });
  };

  const handleCheckout = () => {
    if (isGuest) {
      setGuestDialogOpen(true);
      return;
    }

    startCheckout();
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-slate-950">
          {t("subtotal")}
        </span>
        <PromotionalPrice
          automaticPromotion={automaticPromotion}
          badgeLabel={(discount) => tp("promotionBadge", { discount })}
          className="justify-end"
          locale={locale}
          originalPriceCents={originalSubtotalCents}
          priceClassName="text-2xl text-slate-950"
          promotionalPriceCents={subtotalCents}
        />
      </div>

      {hasMixedIntervals && (
        <div className="mt-4 flex items-start gap-3 rounded-md border border-purple-200 bg-purple-50 p-3 text-sm text-purple-900">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-purple-700" />
          <p>
            {/* On utilise purement et simplement next-intl */}
            {t("mixedIntervalsError")}
          </p>
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={isPending || subtotalCents === 0 || hasMixedIntervals}
        className="mt-5 inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-md bg-purple-700 text-base font-semibold text-white transition hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 active:bg-purple-900 disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-5 animate-spin" />
            {t("redirecting")}
          </>
        ) : (
          t("proceedToCheckout")
        )}
      </button>

      <p className="mt-2 text-center text-xs text-slate-400">
        {t("securePayment")}
      </p>

      <GuestCheckoutDialog
        isPending={isPending}
        onConfirm={startCheckout}
        onOpenChange={setGuestDialogOpen}
        open={guestDialogOpen}
        returnPath="/cart"
      />
    </div>
  );
}
