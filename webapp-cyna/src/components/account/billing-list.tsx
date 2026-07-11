"use client";

import { useState } from "react";
import { AlertCircle, Loader2, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { getInvoiceSignedUrl } from "@/lib/facture/facture.actions";
import type { Tables } from "@/types/database.types";

export function BillingList({
  invoices,
  locale,
}: {
  invoices: Tables<"facture">[];
  locale: string;
}) {
  const t = useTranslations("billing");
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState(false);

  const filteredInvoices = invoices.filter((invoice) => {
    const term = search.trim().toLowerCase();
    return (
      !term ||
      invoice.stripe_invoice_id.toLowerCase().includes(term) ||
      invoice.statut.toLowerCase().includes(term) ||
      String(invoice.montant_total).includes(term)
    );
  });

  const download = async (invoice: Tables<"facture">) => {
    setDownloadError(false);
    setLoadingId(invoice.id_facture);
    try {
      const url = await getInvoiceSignedUrl(invoice.id_facture);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setDownloadError(true);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="w-full">
      <div className="relative mb-6 max-w-md">
        <Search aria-hidden="true" className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
        <Input className="w-full bg-white pl-10" onChange={(event) => setSearch(event.target.value)} placeholder={t("searchPlaceholder")} value={search} />
      </div>
      {downloadError && (
        <p role="alert" className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle aria-hidden="true" className="size-4" />
          {t("downloadError")}
        </p>
      )}
      <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white">
        {filteredInvoices.length > 0 ? (
          <table className="w-full min-w-175 border-collapse text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                {(["id", "date", "amount", "status", "invoice"] as const).map((key) => (
                  <th className="px-4 py-4 font-semibold text-slate-700" key={key}>{t(key)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((invoice) => (
                <tr className="transition-colors hover:bg-slate-50" key={invoice.id_facture}>
                  <td className="px-4 py-4 text-sm text-slate-600">{invoice.stripe_invoice_id}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">{new Date(invoice.date_facture).toLocaleDateString(locale)}</td>
                  <td className="px-4 py-4 font-semibold text-slate-700">{new Intl.NumberFormat(locale, { style: "currency", currency: invoice.devise.toUpperCase() }).format(Number(invoice.montant_total))}</td>
                  <td className="px-4 py-4"><span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium capitalize text-purple-700">{invoice.statut}</span></td>
                  <td className="px-4 py-4">
                    {invoice.storage_path || invoice.hosted_invoice_url ? (
                      <button className="inline-flex items-center gap-2 rounded-md bg-purple-700 px-4 py-2 text-sm font-medium text-white hover:bg-purple-800 disabled:opacity-60" disabled={loadingId === invoice.id_facture} onClick={() => download(invoice)} type="button">
                        {loadingId === invoice.id_facture && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
                        {t("download")}
                      </button>
                    ) : (
                      <span className="text-sm text-slate-400">{t("unavailable")}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-4 py-10 text-slate-500">
            {search ? t("noSearchResults", { search }) : t("noInvoices")}
          </p>
        )}
      </div>
    </div>
  );
}
