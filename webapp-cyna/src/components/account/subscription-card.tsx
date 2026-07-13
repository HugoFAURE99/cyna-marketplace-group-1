"use client";

import { CalendarDays, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export type AccountSubscription = {
  id_abonnement: number;
  id_commande: number;
  statut_abonnement: string;
  date_debut: string;
  date_fin: string | null;
  prix_tarif: {
    prix_tarif_traduction?: { langue: string; nom_prix_tarif: string | null }[];
    produit?: { produit_traduction?: { langue: string; nom_pro: string }[] } | null;
  } | null;
  commande?: {
    date_commande: string;
    montant_total: number;
    statut_commande: string;
  } | null;
};

export function SubscriptionCard({
  subscription,
  layout = "grid",
}: {
  subscription: AccountSubscription;
  layout?: "grid" | "list";
}) {
  const t = useTranslations("subscriptions");
  const locale = useLocale();
  const productTranslations = subscription.prix_tarif?.produit?.produit_traduction ?? [];
  const tariffTranslations = subscription.prix_tarif?.prix_tarif_traduction ?? [];
  const productName = translatedValue(productTranslations, locale, "nom_pro");
  const tariffName = translatedValue(tariffTranslations, locale, "nom_prix_tarif");
  const name = productName || tariffName || t("unknown");
  const normalizedStatus = subscription.statut_abonnement.toLowerCase();
  const active = ["active", "trialing", "actif"].includes(normalizedStatus);
  const knownStatuses = ["active", "trialing", "actif", "canceled", "incomplete", "incomplete_expired", "past_due", "unpaid", "paused", "désactivé"];
  const statusLabel = knownStatuses.includes(normalizedStatus)
    ? t(`statuses.${normalizedStatus}` as Parameters<typeof t>[0])
    : subscription.statut_abonnement;
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <article className={`group relative min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md ${layout === "list" ? "sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]" : "flex h-full flex-col"}`}>
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-700 via-fuchsia-500 to-purple-400" />

      <div className="min-w-0 p-5 pt-6 sm:p-6 sm:pt-7">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700 ring-1 ring-purple-100">
            <ShieldCheck aria-hidden="true" className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">{t("subscriptionNumber", { id: subscription.id_abonnement })}</p>
            <h2 className="mt-1 break-words text-lg font-bold leading-snug text-slate-950">{name}</h2>
            {productName && tariffName && tariffName !== productName && <p className="mt-1 text-sm text-slate-500">{tariffName}</p>}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <span className="text-sm font-medium text-slate-600">{t("status")}</span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${active ? "bg-purple-100 text-purple-800" : "bg-slate-100 text-slate-700"}`}>
            <span aria-hidden="true" className={`size-1.5 rounded-full ${active ? "bg-purple-600" : "bg-slate-500"}`} />
            {statusLabel}
          </span>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 border-t border-slate-100 bg-slate-50/80 p-5 text-sm sm:p-6">
        <DateItem label={t("startDate")} value={date.format(new Date(subscription.date_debut))} />
        {subscription.date_fin ? <DateItem label={t("endDate")} value={date.format(new Date(subscription.date_fin))} /> : <DateItem label={t("endDate")} value={t("ongoing")} />}
      </dl>
      {active && (
        <div className="border-t border-slate-100 bg-white p-5 sm:px-6 sm:pb-6 sm:pt-4">
          <button
            type="button"
            onClick={() => console.log("Cancel subscription", subscription.id_abonnement)}
            className="inline-flex w-full justify-center rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 transition-colors"
          >
            {t("cancelSubscription")}
          </button>
        </div>
      )}
    </article>
  );
}

function DateItem({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-lg bg-white p-3 ring-1 ring-slate-200/80"><dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500"><CalendarDays aria-hidden="true" className="size-3.5" />{label}</dt><dd className="mt-1.5 break-words font-semibold text-slate-900">{value}</dd></div>;
}

function translatedValue<T extends { langue: string }>(items: T[], locale: string, key: keyof T) {
  const row = items.find((item) => item.langue === locale) ?? items.find((item) => item.langue === "fr") ?? items[0];
  const value = row?.[key];
  return typeof value === "string" ? value : undefined;
}
