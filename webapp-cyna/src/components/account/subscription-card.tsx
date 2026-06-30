"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
  };

  // Find the translated name
  const prodTraductions = (subscription as any).prix_tarif?.produit?.produit_traduction || [];
  const prodTranslation = prodTraductions.find((tr: any) => tr.langue === locale) || prodTraductions[0];
  const prodName = prodTranslation?.nom_pro;

  const traductions = (subscription as any).prix_tarif?.prix_tarif_traduction || [];
  const translation = traductions.find((tr: any) => tr.langue === locale) || traductions[0];
  const name = prodName || translation?.nom_prix_tarif || t("unknown");

  if (layout === "list") {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm hover:border-gray-300 transition-colors flex flex-col sm:flex-row gap-4 sm:gap-6 justify-between items-start sm:items-center">
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-2">{name}</h3>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <p>
              <span className="font-medium text-gray-900">{t("status")}:</span>{" "}
              <span className={`px-2 py-0.5 rounded-md font-semibold text-xs ${subscription.statut_abonnement === 'actif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {subscription.statut_abonnement}
              </span>
            </p>
            {subscription.date_debut && (
              <p>
                <span className="font-medium text-gray-900">{t("startDate")}:</span>{" "}
                {new Date(subscription.date_debut).toLocaleDateString(locale)}
              </p>
            )}
            {subscription.date_fin && (
              <p>
                <span className="font-medium text-gray-900">{t("endDate")}:</span>{" "}
                {new Date(subscription.date_fin).toLocaleDateString(locale)}
              </p>
            )}
          </div>
        </div>
        <div className="w-full sm:w-auto mt-2 sm:mt-0">
          <Button 
            variant="destructive" 
            onClick={handleDeactivate} 
            disabled={loading || subscription.statut_abonnement !== "actif"}
            className="w-full sm:w-auto"
          >
            {loading ? t("deactivating") : t("deactivate")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="h-full flex flex-col hover:border-gray-300 transition-colors">
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>
          {t("status")}: <span className={`px-2 py-0.5 rounded-md font-semibold text-xs ml-2 ${subscription.statut_abonnement === 'actif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
            {subscription.statut_abonnement}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {subscription.date_debut && (
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-medium text-gray-900">{t("startDate")}:</span>{" "}
            {new Date(subscription.date_debut).toLocaleDateString(locale)}
          </p>
        )}
        {subscription.date_fin && (
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-medium text-gray-900">{t("endDate")}:</span>{" "}
            {new Date(subscription.date_fin).toLocaleDateString(locale)}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="destructive" 
          onClick={handleDeactivate} 
          disabled={loading || subscription.statut_abonnement !== "actif"}
          className="w-full"
        >
          {loading ? t("deactivating") : t("deactivate")}
        </Button>
      </CardFooter>
    </Card>
  );
}
