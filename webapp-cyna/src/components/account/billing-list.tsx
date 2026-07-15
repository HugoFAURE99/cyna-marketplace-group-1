"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { InvoiceDownloadButton } from "@/components/account/invoice-download-button";
import { Input } from "@/components/ui/input";
import type { Tables } from "@/types/database.types";

export function BillingList({ invoices, locale }: { invoices: Tables<"facture">[]; locale: string }) {
  const t = useTranslations("billing");
  const [search, setSearch] = useState("");
  const filtered = invoices.filter((invoice) => {
    const term = search.trim().toLowerCase();
    return !term || [invoice.stripe_invoice_id, invoice.statut, invoice.montant_total, invoice.id_commande].join(" ").toLowerCase().includes(term);
  });
  const currency = (invoice: Tables<"facture">) => new Intl.NumberFormat(locale, { style: "currency", currency: invoice.devise.toUpperCase() }).format(Number(invoice.montant_total));
  const date = (value: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));

  return <div className="space-y-5">
    <label className="relative block max-w-md"><span className="sr-only">{t("searchPlaceholder")}</span><Search aria-hidden="true" className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" /><Input className="min-h-11 bg-white pl-10" onChange={(event) => setSearch(event.target.value)} placeholder={t("searchPlaceholder")} value={search} /></label>
    {filtered.length ? <>
      <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white md:block"><table className="w-full border-collapse text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50"><tr>{(["id", "order", "date", "amount", "status", "invoice"] as const).map((key) => <th className="px-4 py-3 font-semibold text-slate-700" key={key}>{t(key)}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((invoice) => <tr key={invoice.id_facture}><td className="max-w-56 break-all px-4 py-4 text-slate-600">{invoice.stripe_invoice_id}</td><td className="px-4 py-4 text-slate-600">{invoice.id_commande ? `#${invoice.id_commande}` : t("unavailable")}</td><td className="px-4 py-4 text-slate-600">{date(invoice.date_facture)}</td><td className="px-4 py-4 font-semibold">{currency(invoice)}</td><td className="px-4 py-4"><InvoiceStatus status={invoice.statut} t={t} /></td><td className="px-4 py-4">{invoice.storage_path || invoice.hosted_invoice_url ? <InvoiceDownloadButton invoiceId={invoice.id_facture} /> : <span className="text-slate-500">{t("unavailable")}</span>}</td></tr>)}</tbody></table></div>
      <div className="space-y-3 md:hidden">{filtered.map((invoice) => <article className="rounded-lg border border-slate-200 bg-white p-4" key={invoice.id_facture}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{invoice.id_commande ? `#${invoice.id_commande}` : t("invoice")}</p><p className="mt-1 text-sm text-slate-600">{date(invoice.date_facture)}</p></div><InvoiceStatus status={invoice.statut} t={t} /></div><p className="mt-3 text-lg font-bold">{currency(invoice)}</p><p className="mt-1 break-all text-xs text-slate-500">{invoice.stripe_invoice_id}</p><div className="mt-4">{invoice.storage_path || invoice.hosted_invoice_url ? <InvoiceDownloadButton invoiceId={invoice.id_facture} /> : <span className="text-sm text-slate-500">{t("unavailable")}</span>}</div></article>)}</div>
    </> : <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-600">{search ? t("noSearchResults", { search }) : t("noInvoices")}</div>}
  </div>;
}

function InvoiceStatus({ status, t }: { status: string; t: ReturnType<typeof useTranslations<"billing">> }) {
  const value = ["paid", "open", "draft", "void", "uncollectible"].includes(status.toLowerCase()) ? status.toLowerCase() : "unknown";
  return <span className="inline-flex rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">{t(`statuses.${value}` as Parameters<typeof t>[0])}</span>;
}
