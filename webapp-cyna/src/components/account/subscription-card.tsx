"use client";

import { Button } from "@/components/ui/button";
import { useTranslations, useLocale } from "next-intl";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export interface SubscriptionCardProps {
  subscription: any;
  layout?: "grid" | "list";
}

export function SubscriptionCard({ subscription, layout = "grid" }: SubscriptionCardProps) {
  const t = useTranslations("subscriptions");
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleDeactivate = async () => {
    setLoading(true);
    
    // Attempt to deactivate subscription locally in supabase
    // (Note: in a real application, you might want a server action to call Stripe/Payment gateway too)
    const { error } = await supabase
      .from("abonnement")
      .update({ statut_abonnement: "désactivé" })
      .eq("id_abonnement", subscription.id_abonnement);
      
    if (!error) {
      subscription.statut_abonnement = "désactivé";
    } else {
      console.error("Failed to deactivate subscription", error);
    }
    
    setLoading(false);
    setShowConfirm(false);
  };

  // Find the translated name
  const prodTraductions = (subscription as any).prix_tarif?.produit?.produit_traduction || [];
  const prodTranslation = prodTraductions.find((tr: any) => tr.langue === locale) || prodTraductions[0];
  const prodName = prodTranslation?.nom_pro;

  const traductions = (subscription as any).prix_tarif?.prix_tarif_traduction || [];
  const translation = traductions.find((tr: any) => tr.langue === locale) || traductions[0];
  const name = prodName || translation?.nom_prix_tarif || t("unknown");

  const status = subscription.statut_abonnement || subscription.statut || "";
  const isActive = status.toLowerCase() === "actif" || status.toLowerCase() === "active";

  let daysRemaining = null;
  if (isActive && subscription.date_fin) {
    const endDate = new Date(subscription.date_fin);
    const today = new Date();
    endDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const timeDiff = endDate.getTime() - today.getTime();
    daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
  const isExpiringSoon = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 30;

  const modal = showConfirm && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
        <h3 className="text-xl font-bold text-slate-900 mb-2">{t("confirmDeactivateTitle")}</h3>
        <p className="text-slate-600 mb-6">{t("confirmDeactivateMessage")}</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={loading}>
            {t("cancel")}
          </Button>
          <Button variant="destructive" onClick={handleDeactivate} disabled={loading}>
            {loading ? t("deactivating") : t("confirm")}
          </Button>
        </div>
      </div>
    </div>
  );

  if (layout === "list") {
    return (
      <>
        <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 shadow-sm hover:border-slate-300 transition-colors flex flex-col sm:flex-row gap-4 sm:gap-6 justify-between items-start sm:items-center">
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-2">{name}</h3>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <p>
              <span className="font-medium text-slate-900">{t("status")}:</span>{" "}
              <span className={`px-2 py-0.5 rounded-md font-semibold text-xs ${isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                {status}
              </span>
            </p>
            {subscription.date_debut && (
              <p>
                <span className="font-medium text-slate-900">{t("startDate")}:</span>{" "}
                {new Date(subscription.date_debut).toLocaleDateString(locale)}
              </p>
            )}
            {subscription.date_fin && (
              <p>
                <span className="font-medium text-slate-900">{t("endDate")}:</span>{" "}
                {new Date(subscription.date_fin).toLocaleDateString(locale)}
              </p>
            )}
          </div>
          {isExpiringSoon && (
            <p className="mt-3 text-sm font-semibold text-red-500">
              {t("expiringSoon", { days: daysRemaining! })}
            </p>
          )}
        </div>
        <div className="w-full sm:w-auto mt-2 sm:mt-0">
          <Button 
            variant="outline" 
            onClick={() => setShowConfirm(true)} 
            disabled={loading || !isActive}
            className="w-full sm:w-auto bg-red-100 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all duration-300"
          >
            {t("deactivate")}
          </Button>
        </div>
      </div>
      {modal}
      </>
    );
  }

  return (
    <>
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300">
      <h3 className="text-base font-semibold text-slate-900">{name}</h3>
      <p className="mt-1.5 flex items-center gap-2 text-sm text-slate-600">
        <span className="font-medium text-slate-900">{t("status")}:</span>
        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
          {status}
        </span>
      </p>

      <div className="mt-4 flex-1 space-y-1 text-sm text-slate-600">
        {subscription.date_debut && (
          <p>
            <span className="font-medium text-slate-900">{t("startDate")}:</span>{" "}
            {new Date(subscription.date_debut).toLocaleDateString(locale)}
          </p>
        )}
        {subscription.date_fin && (
          <p>
            <span className="font-medium text-slate-900">{t("endDate")}:</span>{" "}
            {new Date(subscription.date_fin).toLocaleDateString(locale)}
          </p>
        )}
      </div>

      {isExpiringSoon && (
        <p className="mt-4 text-sm font-semibold text-red-500">
          {t("expiringSoon", { days: daysRemaining! })}
        </p>
      )}

      <Button
        variant="outline"
        onClick={() => setShowConfirm(true)}
        disabled={loading || !isActive}
        className="mt-5 w-full bg-red-100 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all duration-300"
      >
        {t("deactivate")}
      </Button>
    </div>
    {modal}
    </>
  );
}
