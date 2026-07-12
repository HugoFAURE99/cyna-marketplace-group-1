"use client";

import { ChevronDown, ChevronUp, Search } from "lucide-react";
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

export type AccountOrder = {
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
            <Link className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700" href="/faq">{t("contactSupport")}</Link>
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
  return <th aria-sort={active ? (ascending ? "ascending" : "descending") : "none"} className="px-4 py-3 font-semibold"><button className="rounded-sm hover:text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700" onClick={onClick} type="button">{label}</button></th>;
}

function ExpandButton({ open, onClick, t }: { open: boolean; onClick: () => void; t: ReturnType<typeof useTranslations<"orders">> }) {
  return <button aria-expanded={open} className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold text-purple-700 hover:bg-purple-50" onClick={onClick} type="button">{open ? t("hideDetails") : t("details")}{open ? <ChevronUp aria-hidden="true" className="size-4" /> : <ChevronDown aria-hidden="true" className="size-4" />}</button>;
}

function OrderDetails({ locale, order, t }: { locale: string; order: AccountOrder; t: ReturnType<typeof useTranslations<"orders">> }) {
  const address = isAddress(order.billing_address_snapshot) ? order.billing_address_snapshot : null;
  return <div className="grid gap-6 lg:grid-cols-3">
    <section><h3 className="font-semibold text-slate-950">{t("detailProducts")}</h3><ul className="mt-2 space-y-2 text-sm text-slate-700">{order.ligne_commande.map((line, index) => <li key={index}>{productName(line, locale) || t("notAvailable")} · {t("quantity", { count: line.quantite })} · {t(`billing.${billingValue(line.prix_tarif?.type_facturation)}` as Parameters<typeof t>[0])}</li>)}</ul></section>
    <section><h3 className="font-semibold text-slate-950">{t("detailBilling")}</h3><div className="mt-2 space-y-1 text-sm text-slate-700"><p>{order.payment_method_last4 ? `${order.payment_method_brand?.toUpperCase() ?? t("card")} •••• ${order.payment_method_last4}` : t("notAvailable")}</p><p>{address ? [address.name, address.line1, address.line2, address.postal_code, address.city, address.country].filter(Boolean).join(", ") : t("notAvailable")}</p></div></section>
    <section><h3 className="font-semibold text-slate-950">{t("detailInvoices")}</h3><div className="mt-2 space-y-3">{order.facture.length ? order.facture.map((invoice) => <div className="flex flex-col items-start gap-2" key={invoice.id_facture}><p className="text-sm text-slate-700">{formatDate(invoice.date_facture, locale)} · {formatCurrency(invoice.montant_total, locale)}</p>{invoice.storage_path || invoice.hosted_invoice_url ? <InvoiceDownloadButton invoiceId={invoice.id_facture} /> : <span className="text-sm text-slate-500">{t("invoicePending")}</span>}</div>) : <p className="text-sm text-slate-600">{t("noInvoices")}</p>}</div></section>
  </div>;
}

function StatusBadge({ status, t }: { status: string; t: ReturnType<typeof useTranslations<"orders">> }) {
  const normalized = normalizeStatus(status);
  const styles = { completed: "bg-purple-100 text-purple-800", pending: "bg-amber-100 text-amber-800", cancelled: "bg-slate-100 text-slate-700", failed: "bg-slate-200 text-slate-900" }[normalized];
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
function categoryName(line: OrderLine, locale: string) { const values = line.prix_tarif?.produit?.categorie?.categorie_traduction ?? []; return values.find((item) => item.langue === locale)?.cat_nom ?? values.find((item) => item.langue === "fr")?.cat_nom ?? values[0]?.cat_nom ?? ""; }
function formatDate(value: string, locale: string) { return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value)); }
function formatCurrency(value: number, locale: string) { return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(value); }
function isAddress(value: Json | null): value is { [key: string]: Json | undefined } { return !!value && typeof value === "object" && !Array.isArray(value); }
