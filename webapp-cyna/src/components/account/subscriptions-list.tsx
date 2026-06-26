"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { SubscriptionCard } from "@/components/account/subscription-card";
import { useTranslations } from "next-intl";

export function SubscriptionsList({ subscriptions }: { subscriptions: any[] }) {
  const t = useTranslations("subscriptions");
  const [search, setSearch] = useState("");

  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (!search) return true;
    const term = search.toLowerCase();
    const planName = sub.prix_tarif?.prix_tarif_traduction?.[0]?.nom_prix_tarif || "";
    return (
      (sub.statut && sub.statut.toLowerCase().includes(term)) ||
      planName.toLowerCase().includes(term) ||
      (sub.id_abonnement && sub.id_abonnement.toString().includes(term))
    );
  });

  return (
    <div className="w-full">
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder={t("searchPlaceholder")}
          className="pl-10 w-full max-w-md bg-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="w-full">
        {filteredSubscriptions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSubscriptions.map((subscription) => (
              <SubscriptionCard key={subscription.id_abonnement} subscription={subscription} />
            ))}
          </div>
        ) : search ? (
          <p className="text-gray-500 py-8">{t("noSearchResults", { search })}</p>
        ) : (
          <p className="text-gray-500 py-8">{t("noSubscriptions")}</p>
        )}
      </div>
    </div>
  );
}
