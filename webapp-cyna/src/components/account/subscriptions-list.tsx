"use client";

import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import {
  SubscriptionCard,
  subscriptionDisplayName,
  type AccountSubscription,
} from "@/components/account/subscription-card";
import { Input } from "@/components/ui/input";

export function SubscriptionsList({
  subscriptions,
}: {
  subscriptions: AccountSubscription[];
}) {
  const t = useTranslations("subscriptions");
  const locale = useLocale();
  const [search, setSearch] = useState("");

  const term = search.trim().toLocaleLowerCase(locale);
  const filteredSubscriptions = subscriptions.filter((subscription) => {
    if (!term) return true;
    return [
      subscription.statut_abonnement,
      subscriptionDisplayName(subscription, locale),
      String(subscription.id_abonnement),
      String(subscription.id_commande),
    ].some((value) => value.toLocaleLowerCase(locale).includes(term));
  });

  const groupedSubscriptions = filteredSubscriptions.reduce<
    Record<string, AccountSubscription[]>
  >((groups, subscription) => {
    const key = subscription.id_commande
      ? String(subscription.id_commande)
      : "unknown";
    (groups[key] ??= []).push(subscription);
    return groups;
  }, {});

  return (
    <div className="w-full">
      <div className="relative mb-5 w-full sm:max-w-md">
        <Search
          aria-hidden="true"
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
        />
        <Input
          className="h-10 w-full bg-white pl-9"
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("searchPlaceholder")}
          type="search"
          value={search}
        />
      </div>

      {filteredSubscriptions.length > 0 ? (
        <div className="space-y-7">
          {Object.entries(groupedSubscriptions)
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([orderId, grouped]) => (
              <section key={orderId}>
                <div className="mb-3 flex items-baseline justify-between gap-3 px-0.5">
                  <h3 className="text-sm font-bold text-slate-900">
                    {t("orderTitle", {
                      id: orderId !== "unknown" ? orderId : "?",
                    })}
                  </h3>
                  {grouped[0]?.commande?.date_commande && (
                    <span className="text-xs text-slate-400">
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                      }).format(new Date(grouped[0].commande.date_commande))}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {grouped.map((subscription) => (
                    <SubscriptionCard
                      key={subscription.id_abonnement}
                      subscription={subscription}
                    />
                  ))}
                </div>
              </section>
            ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
          {search
            ? t("noSearchResults", { search })
            : t("noSubscriptions")}
        </p>
      )}
    </div>
  );
}
