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
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            type="text"
            placeholder={t("searchPlaceholder")}
            className="min-h-11 w-full bg-white pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex min-h-11 items-center gap-1 rounded-lg bg-slate-100 p-1">
          <Button 
            aria-label={t("viewList")}
            aria-pressed={viewMode === "list"}
            variant="ghost" 
            size="sm" 
            className={`min-h-9 px-3 py-1.5 ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setViewMode('list')}
            title={t("viewList")}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button 
            aria-label={t("viewGrid")}
            aria-pressed={viewMode === "grid"}
            variant="ghost" 
            size="sm" 
            className={`min-h-9 px-3 py-1.5 ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setViewMode('grid')}
            title={t("viewGrid")}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="w-full">
        {filteredSubscriptions.length > 0 ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4"}>
            {filteredSubscriptions.map((subscription) => (
              <SubscriptionCard key={subscription.id_abonnement} subscription={subscription} layout={viewMode} />
            ))}
          </div>
        ) : search ? (
          <p className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-slate-500">{t("noSearchResults", { search })}</p>
        ) : (
          <p className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-slate-500">{t("noSubscriptions")}</p>
        )}
      </div>
    </div>
  );
}
