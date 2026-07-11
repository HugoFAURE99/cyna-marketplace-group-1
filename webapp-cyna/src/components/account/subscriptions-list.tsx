"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, LayoutGrid, List } from "lucide-react";
import { SubscriptionCard, type AccountSubscription } from "@/components/account/subscription-card";
import { useTranslations } from "next-intl";

export function SubscriptionsList({ subscriptions }: { subscriptions: AccountSubscription[] }) {
  const t = useTranslations("subscriptions");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (!search) return true;
    const term = search.toLowerCase();
    const prodTrad = sub.prix_tarif?.produit?.produit_traduction?.[0]?.nom_pro;
    const planName = prodTrad || sub.prix_tarif?.prix_tarif_traduction?.[0]?.nom_prix_tarif || "";
    return (
      sub.statut_abonnement.toLowerCase().includes(term) ||
      planName.toLowerCase().includes(term) ||
      (sub.id_abonnement && sub.id_abonnement.toString().includes(term))
    );
  });

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            type="text"
            placeholder={t("searchPlaceholder")}
            className="pl-10 w-full bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`px-3 py-1.5 h-auto ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setViewMode('list')}
            title={t("viewList")}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`px-3 py-1.5 h-auto ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setViewMode('grid')}
            title={t("viewGrid")}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="w-full">
        {filteredSubscriptions.length > 0 ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
            {filteredSubscriptions.map((subscription) => (
              <SubscriptionCard key={subscription.id_abonnement} subscription={subscription} layout={viewMode} />
            ))}
          </div>
        ) : search ? (
          <p className="px-4 py-8 text-slate-500">{t("noSearchResults", { search })}</p>
        ) : (
          <p className="px-4 py-8 text-slate-500">{t("noSubscriptions")}</p>
        )}
      </div>
    </div>
  );
}
