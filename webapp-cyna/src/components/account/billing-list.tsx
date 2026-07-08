"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { getFactureSignedUrl } from "@/lib/facture/facture.actions";

export function BillingList({ invoices, locale }: { invoices: any[], locale: string }) {
  const t = useTranslations("billing");
  const tOrders = useTranslations("orders");
  const [search, setSearch] = useState("");
  const [loadingInvoice, setLoadingInvoice] = useState<string | null>(null);
  
  const getStatusText = (status: string) => {
    if (!status) return "";
    const s = status.toLowerCase();
    if (s === 'payée' || s === 'payee' || s === 'completed' || s === 'validée' || s === 'validee') return tOrders("status.completed");
    if (s === 'en attente' || s === 'pending') return tOrders("status.pending");
    if (s === 'annulée' || s === 'annulee' || s === 'cancelled') return tOrders("status.cancelled");
    if (s === 'failed' || s === 'échouée') return tOrders("status.failed");
    return status;
  };

  const handleDownload = async (fileName: string) => {
    try {
      setLoadingInvoice(fileName);
      const signedUrl = await getFactureSignedUrl(fileName);
      if (signedUrl) {
        window.open(signedUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      console.error("Failed to get signed URL for invoice:", error);
    } finally {
      setLoadingInvoice(null);
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      invoice.id_commande.toString().includes(term) ||
      (invoice.statut_commande && invoice.statut_commande.toLowerCase().includes(term)) ||
      (invoice.montant_total && invoice.montant_total.toString().includes(term))
    );
  });

  return (
    <div className="w-full">
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          type="text"
          placeholder={t("searchPlaceholder")}
          className="pl-10 w-full max-w-md bg-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="w-full overflow-x-auto rounded-md border border-slate-100">
        {filteredInvoices.length > 0 ? (
            <table className="w-full text-left border-collapse min-w-175">
              <thead>
                <tr className="border-b-2 border-slate-100 bg-slate-50/50">
                  <th className="pb-4 pt-4 px-4 font-bold text-slate-700">{t("id")}</th>
                  <th className="pb-4 pt-4 px-4 font-bold text-slate-700">{t("date")}</th>
                  <th className="pb-4 pt-4 px-4 font-bold text-slate-700">{t("amount")}</th>
                  <th className="pb-4 pt-4 px-4 font-bold text-slate-700">{t("status")}</th>
                  <th className="pb-4 pt-4 px-4 font-bold text-slate-700">{t("invoice")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id_commande} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 text-slate-600">#{invoice.id_commande}</td>
                    <td className="py-4 px-4 text-slate-600">
                      {new Date(invoice.date_commande).toLocaleDateString(locale)}
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-semibold">{invoice.montant_total} €</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        invoice.statut_commande.toLowerCase() === 'payée' || invoice.statut_commande.toLowerCase() === 'payee' || invoice.statut_commande.toLowerCase() === 'completed' || invoice.statut_commande.toLowerCase() === 'validée' || invoice.statut_commande.toLowerCase() === 'validee'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {getStatusText(invoice.statut_commande)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {invoice.url_facture ? (
                        <button
                          onClick={() => handleDownload(invoice.url_facture)}
                          disabled={loadingInvoice === invoice.url_facture}
                          className="inline-flex items-center gap-2 rounded-md bg-purple-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-purple-800 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {loadingInvoice === invoice.url_facture ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : null}
                          {t("download")}
                        </button>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        ) : search ? (
          <p className="text-slate-500 py-8">{t("noSearchResults", { search })}</p>
        ) : (
          <p className="text-slate-500 py-8">{t("noInvoices")}</p>
        )}
      </div>
    </div>
  );
}
