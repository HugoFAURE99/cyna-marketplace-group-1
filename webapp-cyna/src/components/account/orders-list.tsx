"use client";

import {
  ArrowRight,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  CreditCard,
  FileText,
  Package,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { InvoiceDownloadButton } from "@/components/account/invoice-download-button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import type { Json, Tables } from "@/types/database.types";

type OrderLine = {
  prix_unitaire: number;
  quantite: number;
  sous_total: number;
  prix_tarif: {
    type_facturation: string;
    produit: {
      categorie: { categorie_traduction: { cat_nom: string; langue: string }[] } | null;
      id_categorie: number;
      produit_traduction: { langue: string; nom_pro: string }[];
    } | null;
  } | null;
};

type CurrentSubscription = {
  annulation_programmee: boolean;
  date_fin: string | null;
  id_abonnement: number;
  nombre_utilisateurs: number;
  statut_abonnement: string;
  prix_tarif: {
    prix: number;
    type_facturation: string;
    produit: {
      produit_traduction: { langue: string; nom_pro: string }[];
    } | null;
  } | null;
};

export type AccountOrder = {
  abonnement: CurrentSubscription[];
  billing_address_snapshot: Json | null;
  date_commande: string;
  facture: Tables<"facture">[];
  id_commande: number;
  ligne_commande: OrderLine[];
  montant_total: number;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
  statut_commande: string;
};

type SortKey = "date" | "id" | "total";
type BillingFilter = "all" | "annual" | "monthly" | "one_time";

export function OrdersList({ orders, locale }: { orders: AccountOrder[]; locale: string }) {
  const t = useTranslations("orders");
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("all");
  const [status, setStatus] = useState("all");
  const [billing, setBilling] = useState<BillingFilter>("all");
  const [service, setService] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [ascending, setAscending] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const years = useMemo(() => Array.from(new Set(orders.map((order) => String(new Date(order.date_commande).getFullYear())))).sort().reverse(), [orders]);
  const statuses = useMemo(() => Array.from(new Set(orders.map((order) => order.statut_commande))).sort(), [orders]);
  const services = useMemo(() => Array.from(new Set(orders.flatMap((order) => order.ligne_commande.map((line) => categoryName(line, locale)).filter(Boolean)))).sort(), [orders, locale]);

  const visibleOrders = useMemo(() => {
    const term = search.trim().toLocaleLowerCase(locale);
    const result = orders.filter((order) => {
      const names = order.ligne_commande.map((line) => productName(line, locale));
      const categories = order.ligne_commande.map((line) => categoryName(line, locale));
      const haystack = [order.id_commande, order.statut_commande, new Date(order.date_commande).toLocaleDateString(locale), ...names].join(" ").toLocaleLowerCase(locale);
      return (!term || haystack.includes(term))
        && (year === "all" || String(new Date(order.date_commande).getFullYear()) === year)
        && (status === "all" || order.statut_commande === status)
        && (service === "all" || categories.includes(service))
        && (billing === "all" || order.ligne_commande.some((line) => billingValue(line.prix_tarif?.type_facturation) === billing));
    });
    return result.sort((a, b) => {
      const values = sortKey === "date"
        ? [new Date(a.date_commande).getTime(), new Date(b.date_commande).getTime()]
        : sortKey === "id"
          ? [a.id_commande, b.id_commande]
          : [a.montant_total, b.montant_total];
      return (values[0] - values[1]) * (ascending ? 1 : -1);
    });
  }, [ascending, billing, locale, orders, search, service, sortKey, status, year]);

  const grouped = useMemo(() => visibleOrders.reduce<Record<string, AccountOrder[]>>((groups, order) => {
    const key = String(new Date(order.date_commande).getFullYear());
    (groups[key] ??= []).push(order);
    return groups;
  }, {}), [visibleOrders]);
  const setSort = (next: SortKey) => {
    if (sortKey === next) setAscending((value) => !value);
    else { setSortKey(next); setAscending(false); }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_repeat(4,minmax(140px,auto))]">
        <label className="text-xs font-semibold text-slate-600 sm:col-span-2 xl:col-span-1">
          <span className="mb-1 block">{t("filters.search")}</span>
          <span className="relative block">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
            <Input className="min-h-11 bg-white pl-10" onChange={(event) => setSearch(event.target.value)} placeholder={t("searchPlaceholder")} value={search} />
          </span>
        </label>
        <Filter label={t("filters.year")} onChange={setYear} options={years} value={year} />
        <Filter label={t("filters.service")} onChange={setService} options={services} value={service} />
        <Filter label={t("filters.billing")} onChange={(value) => setBilling(value as BillingFilter)} options={["monthly", "annual", "one_time"]} render={(value) => t(`billing.${value}` as Parameters<typeof t>[0])} value={billing} />
        <Filter label={t("filters.status")} onChange={setStatus} options={statuses} render={(value) => statusText(value, t)} value={status} />
      </div>

      {visibleOrders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
          <p className="text-slate-600">{search ? t("noSearchResults", { search }) : t("noOrders")}</p>
          <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
            <Link className="inline-flex min-h-11 items-center justify-center rounded-md bg-purple-700 px-4 text-sm font-semibold text-white" href="/search">{t("browseProducts")}</Link>
            <Link className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 active:bg-slate-100" href="/faq#contact">{t("contactSupport")}</Link>
          </div>
        </div>
      ) : Object.entries(grouped).sort(([a], [b]) => Number(b) - Number(a)).map(([groupYear, groupOrders]) => (
        <section className="space-y-3" key={groupYear}>
          <h2 className="text-xl font-bold text-slate-950">{groupYear}</h2>
          <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-700"><tr>
                <SortableHead active={sortKey === "id"} ascending={ascending} label={t("columns.id")} onClick={() => setSort("id")} />
                <th className="px-4 py-3 font-semibold">{t("columns.products")}</th>
                <SortableHead active={sortKey === "date"} ascending={ascending} label={t("columns.date")} onClick={() => setSort("date")} />
                <SortableHead active={sortKey === "total"} ascending={ascending} label={t("columns.amount")} onClick={() => setSort("total")} />
                <th className="px-4 py-3 font-semibold">{t("columns.status")}</th><th><span className="sr-only">{t("details")}</span></th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">{(groupOrders ?? []).flatMap((order) => {
                const open = expanded === order.id_commande;
                return [
                  <tr key={`row-${order.id_commande}`}>
                    <td className="px-4 py-4 font-semibold text-slate-900">#{order.id_commande}</td>
                    <td className="max-w-64 px-4 py-4 text-slate-700">{order.ligne_commande.map((line) => productName(line, locale)).join(", ") || t("notAvailable")}</td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(order.date_commande, locale)}</td>
                    <td className="px-4 py-4 font-semibold">{formatCurrency(order.montant_total, locale)}</td>
                    <td className="px-4 py-4"><StatusBadge status={order.statut_commande} t={t} /></td>
                    <td className="px-4 py-4 text-right"><ExpandButton open={open} onClick={() => setExpanded(open ? null : order.id_commande)} t={t} /></td>
                  </tr>,
                  open ? <tr key={`detail-${order.id_commande}`}><td className="bg-slate-50 px-5 py-5" colSpan={6}><OrderDetails locale={locale} order={order} t={t} /></td></tr> : null,
                ];
              })}</tbody>
            </table>
          </div>
          <div className="space-y-3 md:hidden">{(groupOrders ?? []).map((order) => {
            const open = expanded === order.id_commande;
            return <article className="rounded-lg border border-slate-200 bg-white p-4" key={order.id_commande}>
              <div className="flex items-start justify-between gap-3"><div><p className="font-bold">#{order.id_commande}</p><p className="mt-1 text-sm text-slate-600">{formatDate(order.date_commande, locale)}</p></div><StatusBadge status={order.statut_commande} t={t} /></div>
              <p className="mt-3 font-medium text-slate-900">{order.ligne_commande.map((line) => productName(line, locale)).join(", ") || t("notAvailable")}</p>
              <p className="mt-2 text-lg font-bold">{formatCurrency(order.montant_total, locale)}</p>
              <div className="mt-3"><ExpandButton open={open} onClick={() => setExpanded(open ? null : order.id_commande)} t={t} /></div>
              {open && <div className="mt-4 border-t border-slate-100 pt-4"><OrderDetails locale={locale} order={order} t={t} /></div>}
            </article>;
          })}</div>
        </section>
      ))}
    </div>
  );
}

function Filter({ label, onChange, options, render = (value) => value, value }: { label: string; onChange: (value: string) => void; options: string[]; render?: (value: string) => string; value: string }) {
  return <label className="text-xs font-semibold text-slate-600"><span className="mb-1 block">{label}</span><select className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" onChange={(event) => onChange(event.target.value)} value={value}><option value="all">{label}</option>{options.map((option) => <option key={option} value={option}>{render(option)}</option>)}</select></label>;
}

function SortableHead({ active, ascending, label, onClick }: { active: boolean; ascending: boolean; label: string; onClick: () => void }) {
  return <th aria-sort={active ? (ascending ? "ascending" : "descending") : "none"} className="px-4 py-3 font-semibold"><button className="min-h-11 cursor-pointer rounded-sm px-2 transition hover:bg-purple-50 hover:text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 active:bg-purple-100" onClick={onClick} type="button">{label}</button></th>;
}

function ExpandButton({ open, onClick, t }: { open: boolean; onClick: () => void; t: ReturnType<typeof useTranslations<"orders">> }) {
  return <button aria-expanded={open} className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold text-purple-700 transition hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 active:bg-purple-100" onClick={onClick} type="button">{open ? t("hideDetails") : t("details")}{open ? <ChevronUp aria-hidden="true" className="size-3.5" /> : <ChevronDown aria-hidden="true" className="size-3.5" />}</button>;
}

function OrderDetails({ locale, order, t }: { locale: string; order: AccountOrder; t: ReturnType<typeof useTranslations<"orders">> }) {
  const address = isAddress(order.billing_address_snapshot) ? order.billing_address_snapshot : null;
  const isFailed = normalizeStatus(order.statut_commande) === "failed";
  const productNameFallback = order.ligne_commande[0] ? (productName(order.ligne_commande[0], locale) || `Commande #${order.id_commande}`) : `Commande #${order.id_commande}`;
  const contactSubject = t("billingIssue", { name: productNameFallback });
  const contactHref = `/faq?category=order&subject=${encodeURIComponent(contactSubject)}&orderId=${order.id_commande}`;
  const subscriptions = order.abonnement ?? [];
  const currentSubscriptions = subscriptions.filter((subscription) =>
    ["active", "trialing", "past_due", "actif"].includes(
      subscription.statut_abonnement.toLowerCase(),
    ),
  );
  const renewableSubscriptions = currentSubscriptions.filter(
    (subscription) => !subscription.annulation_programmee,
  );
  const nextRenewalDate = renewableSubscriptions
    .map((subscription) => subscription.date_fin)
    .filter((value): value is string => Boolean(value))
    .sort()[0] ?? null;
  const nextRenewalSubscriptions = nextRenewalDate
    ? renewableSubscriptions.filter(
        (subscription) => subscription.date_fin === nextRenewalDate,
      )
    : renewableSubscriptions;
  const nextRenewalTotal = nextRenewalSubscriptions.reduce(
    (total, subscription) =>
      total +
      (subscription.prix_tarif?.prix ?? 0) *
        subscription.nombre_utilisateurs,
    0,
  );
  const hasSubscriptions = currentSubscriptions.length > 0;

  const actionButton = isFailed ? (
    <Link href={contactHref as never} className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700">
      {t("contactSupport")}
    </Link>
  ) : subscriptions.length > 0 ? (
    <Link href={`/user-dashboard/purchases/orders/${order.id_commande}/subscriptions` as never} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-purple-200 bg-white px-3 py-1.5 text-xs font-semibold text-purple-800 transition hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700">
      {t("viewSubscriptions")}<ArrowRight aria-hidden="true" className="size-3.5" />
    </Link>
  ) : null;

  return <div className="space-y-4">
    {hasSubscriptions && (
      <section className="rounded-lg border border-purple-100 bg-purple-50/60 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-purple-950"><CalendarClock aria-hidden="true" className="size-4 text-purple-700" />{t("currentSubscriptions")}</h3>
            <p className="mt-1 text-xs text-purple-900/70">{t("renewalEstimateHint")}</p>
          </div>
          {nextRenewalSubscriptions.length > 0 && (
            <div className="text-left sm:text-right">
              <p className="text-xs text-purple-800">{t("nextRenewal")}</p>
              <p className="mt-0.5 font-bold text-purple-950">{nextRenewalDate ? formatDate(nextRenewalDate, locale) : t("notAvailable")}<span className="mx-1.5 text-purple-300">·</span>{formatCurrency(nextRenewalTotal / 100, locale)}</p>
            </div>
          )}
        </div>
        <ul className="mt-4 divide-y divide-purple-100 rounded-md border border-purple-100 bg-white">
          {currentSubscriptions.map((subscription) => (
            <li className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between" key={subscription.id_abonnement}>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{currentSubscriptionName(subscription, locale) || t("notAvailable")}</p>
                <p className="mt-0.5 text-xs text-slate-500">{t("currentUsers", { count: subscription.nombre_utilisateurs })}{subscription.annulation_programmee && subscription.date_fin ? ` · ${t("endsOn", { date: formatDate(subscription.date_fin, locale) })}` : ""}</p>
              </div>
              <p className="shrink-0 text-sm font-bold text-purple-800">{formatCurrency(((subscription.prix_tarif?.prix ?? 0) * subscription.nombre_utilisateurs) / 100, locale)}<span className="ml-1 text-xs font-normal text-slate-500">{billingSuffix(subscription.prix_tarif?.type_facturation, t)}</span></p>
            </li>
          ))}
        </ul>
        {nextRenewalSubscriptions.length === 0 && <p className="mt-3 text-sm font-medium text-purple-900">{t("noUpcomingRenewal")}</p>}
      </section>
    )}

    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-950"><Package aria-hidden="true" className="size-4 text-purple-700" />{t("detailProducts")}</h3>
        <ul className="mt-3 divide-y divide-slate-100">
          {order.ligne_commande.map((line, index) => (
            <li className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0" key={index}>
              <div><p className="text-sm font-semibold text-slate-900">{productName(line, locale) || t("notAvailable")}</p><p className="mt-0.5 text-xs text-slate-500">{t("quantity", { count: line.quantite })} · {t(`billing.${billingValue(line.prix_tarif?.type_facturation)}` as Parameters<typeof t>[0])}</p></div>
              <p className="shrink-0 text-sm font-semibold text-slate-800">{formatCurrency(line.sous_total, locale)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-sm"><span className="font-medium text-slate-500">{t("originalTotal")}</span><span className="font-bold text-slate-950">{formatCurrency(order.montant_total, locale)}</span></div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-950"><CreditCard aria-hidden="true" className="size-4 text-purple-700" />{t("detailBilling")}</h3>
        <dl className="mt-3 space-y-3 text-sm">
          <div><dt className="text-xs text-slate-500">{t("paymentMethod")}</dt><dd className="mt-0.5 font-medium text-slate-800">{order.payment_method_last4 ? `${order.payment_method_brand?.toUpperCase() ?? t("card")} •••• ${order.payment_method_last4}` : t("notAvailable")}</dd></div>
          <div><dt className="text-xs text-slate-500">{t("billingAddress")}</dt><dd className="mt-0.5 leading-5 text-slate-700">{address ? [address.name, address.line1, address.line2, address.postal_code, address.city, address.country].filter(Boolean).join(", ") : t("notAvailable")}</dd></div>
        </dl>
      </section>
    </div>

    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-sm font-bold text-slate-950"><FileText aria-hidden="true" className="size-4 text-purple-700" />{t("detailInvoices")}</h3>{actionButton}</div>
      {order.facture.length ? (
        <ul className="mt-3 divide-y divide-slate-100">
          {order.facture.map((invoice) => (
            <li className="flex flex-col gap-2 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between" key={invoice.id_facture}>
              <p className="text-sm text-slate-700">{formatDate(invoice.date_facture, locale)} · <span className="font-semibold text-slate-900">{formatCurrency(invoice.montant_total, locale)}</span></p>
              {invoice.storage_path || invoice.hosted_invoice_url ? <InvoiceDownloadButton compact invoiceId={invoice.id_facture} /> : <span className="text-xs text-slate-500">{t("invoicePending")}</span>}
            </li>
          ))}
        </ul>
      ) : <p className="mt-3 text-sm text-slate-600">{t("noInvoices")}</p>}
    </section>
  </div>;
}

function StatusBadge({ status, t }: { status: string; t: ReturnType<typeof useTranslations<"orders">> }) {
  const normalized = normalizeStatus(status);
  const styles = { completed: "bg-purple-100 text-purple-800", pending: "bg-amber-100 text-amber-800", cancelled: "bg-slate-100 text-slate-700", failed: "bg-red-100 text-red-800" }[normalized];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}>{t(`status.${normalized}`)}</span>;
}

function normalizeStatus(status: string): "completed" | "pending" | "cancelled" | "failed" {
  const value = status.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (["payee", "completed", "validee", "paid"].includes(value)) return "completed";
  if (["annulee", "cancelled", "canceled"].includes(value)) return "cancelled";
  if (["failed", "echouee"].includes(value)) return "failed";
  return "pending";
}
function statusText(status: string, t: ReturnType<typeof useTranslations<"orders">>) {
  return t(`status.${normalizeStatus(status)}`);
}

function billingValue(value?: string | null): Exclude<BillingFilter, "all"> {
  const normalized = value?.toLowerCase();
  if (normalized === "annuel" || normalized === "annual") return "annual";
  if (normalized === "mensuel" || normalized === "monthly") return "monthly";
  return "one_time";
}
function productName(line: OrderLine, locale: string) { const values = line.prix_tarif?.produit?.produit_traduction ?? []; return values.find((item) => item.langue === locale)?.nom_pro ?? values.find((item) => item.langue === "fr")?.nom_pro ?? values[0]?.nom_pro ?? ""; }
function currentSubscriptionName(subscription: CurrentSubscription, locale: string) { const values = subscription.prix_tarif?.produit?.produit_traduction ?? []; return values.find((item) => item.langue === locale)?.nom_pro ?? values.find((item) => item.langue === "fr")?.nom_pro ?? values[0]?.nom_pro ?? ""; }
function billingSuffix(value: string | undefined, t: ReturnType<typeof useTranslations<"orders">>) { const normalized = value?.toLowerCase(); if (normalized === "mensuel" || normalized === "monthly") return t("perMonth"); if (normalized === "annuel" || normalized === "annual") return t("perYear"); return ""; }
function categoryName(line: OrderLine, locale: string) { const values = line.prix_tarif?.produit?.categorie?.categorie_traduction ?? []; return values.find((item) => item.langue === locale)?.cat_nom ?? values.find((item) => item.langue === "fr")?.cat_nom ?? values[0]?.cat_nom ?? ""; }
function formatDate(value: string, locale: string) { return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value)); }
function formatCurrency(value: number, locale: string) { return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(value); }
function isAddress(value: Json | null): value is { [key: string]: Json | undefined } { return !!value && typeof value === "object" && !Array.isArray(value); }
