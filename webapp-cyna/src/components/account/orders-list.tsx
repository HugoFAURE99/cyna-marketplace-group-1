"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUpDown, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { getFactureSignedUrl } from "@/lib/facture/facture.actions";

type SortColumn = "id_commande" | "date_commande" | "montant_total" | null;
type SortDirection = "asc" | "desc";

export function OrdersList({ orders, locale }: { orders: any[], locale: string }) {
  const t = useTranslations("orders");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subscriptionFilter, setSubscriptionFilter] = useState("all");
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [loadingInvoice, setLoadingInvoice] = useState<string | null>(null);

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

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSubscriptionType = (order: any) => {
    if (!order.ligne_commande || !Array.isArray(order.ligne_commande)) return t("subscriptionType.unknown");
    const types = order.ligne_commande
      .map((lc: any) => lc.prix_tarif?.type_facturation?.toLowerCase())
      .filter(Boolean);
    
    if (types.length === 0) return t("subscriptionType.unknown");
    
    return Array.from(new Set(types))
      .map(type => {
        if (type === "annuel") return t("subscriptionType.annuel");
        if (type === "mensuel") return t("subscriptionType.mensuel");
        if (type === "unique") return t("subscriptionType.unique");
        return type; // Fallback if the database has unexpected values
      })
      .join(", ");
  };

  const unknownText = t("subscriptionType.unknown");
  
  const getStatusText = (status: string) => {
    if (!status) return "";
    const s = status.toLowerCase();
    if (s === 'payée' || s === 'payee' || s === 'completed' || s === 'validée' || s === 'validee') return t("status.completed");
    if (s === 'en attente' || s === 'pending') return t("status.pending");
    if (s === 'annulée' || s === 'annulee' || s === 'cancelled') return t("status.cancelled");
    if (s === 'failed' || s === 'échouée') return t("status.failed");
    return status;
  };

  const uniqueStatuses = Array.from(new Set(orders.map(o => o.statut_commande).filter(Boolean)));

  const filteredOrders = orders.filter((order) => {
    if (search) {
      const term = search.toLowerCase();
      const matchesSearch = 
        order.id_commande.toString().includes(term) ||
        (order.statut_commande && order.statut_commande.toLowerCase().includes(term)) ||
        (order.montant_total && order.montant_total.toString().includes(term));
      if (!matchesSearch) return false;
    }
    
    if (statusFilter !== "all" && order.statut_commande !== statusFilter) return false;
    if (subscriptionFilter !== "all" && !getSubscriptionType(order).includes(subscriptionFilter)) return false;
    
    return true;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (!sortColumn) return 0;
    
    let valueA = a[sortColumn];
    let valueB = b[sortColumn];
    
    if (sortColumn === "date_commande") {
      valueA = new Date(valueA).getTime();
      valueB = new Date(valueB).getTime();
    }
    
    if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
    if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            type="text"
            placeholder={t("searchPlaceholder")}
            className="pl-10 w-full bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Select value={subscriptionFilter} onValueChange={(val) => setSubscriptionFilter(val || "all")}>
            <SelectTrigger className="w-full sm:w-45 bg-white">
              <SelectValue placeholder={t("allSubscriptions")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allSubscriptions")}</SelectItem>
              <SelectItem value={t("subscriptionType.annuel")}>{t("subscriptionType.annuel")}</SelectItem>
              <SelectItem value={t("subscriptionType.mensuel")}>{t("subscriptionType.mensuel")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
            <SelectTrigger className="w-full sm:w-45 bg-white capitalize">
              <SelectValue placeholder={t("allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              {uniqueStatuses.map(status => (
                <SelectItem key={status} value={status} className="capitalize">
                  {getStatusText(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto w-full rounded-md border border-slate-100">
        {filteredOrders.length > 0 ? (
          <table className="w-full text-left border-collapse min-w-200">
            <thead>
              <tr className="border-b-2 border-slate-100 bg-slate-50/50">
                <th className="pb-4 pt-4 px-4 font-bold text-slate-700 cursor-pointer" onClick={() => handleSort("id_commande")}>
                  <div className="flex items-center gap-1 hover:text-slate-900">
                    {t("columns.id")}
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="pb-4 pt-4 px-4 font-bold text-slate-700 cursor-pointer" onClick={() => handleSort("date_commande")}>
                  <div className="flex items-center gap-1 hover:text-slate-900">
                    {t("columns.date")}
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="pb-4 pt-4 px-4 font-bold text-slate-700 cursor-pointer" onClick={() => handleSort("montant_total")}>
                  <div className="flex items-center gap-1 hover:text-slate-900">
                    {t("columns.amount")}
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="pb-4 pt-4 px-4 font-bold text-slate-700">{t("columns.subscription")}</th>
                <th className="pb-4 pt-4 px-4 font-bold text-slate-700">{t("columns.status")}</th>
                <th className="pb-4 pt-4 px-4 font-bold text-slate-700">{t("columns.invoice")}</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.map((order) => (
                <tr key={order.id_commande} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 text-slate-600">#{order.id_commande}</td>
                  <td className="py-4 px-4 text-slate-600">
                    {new Date(order.date_commande).toLocaleDateString(locale)}
                  </td>
                  <td className="py-4 px-4 text-slate-600 font-semibold">{order.montant_total} €</td>
                  <td className="py-4 px-4 text-slate-600 font-medium capitalize">{getSubscriptionType(order)}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                      order.statut_commande.toLowerCase() === 'payée' || order.statut_commande.toLowerCase() === 'payee' || order.statut_commande.toLowerCase() === 'completed' || order.statut_commande.toLowerCase() === 'validée' || order.statut_commande.toLowerCase() === 'validee'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                      }`}>
                      {getStatusText(order.statut_commande)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {order.url_facture ? (
                      <button
                        onClick={() => handleDownload(order.url_facture)}
                        disabled={loadingInvoice === order.url_facture}
                        className="inline-flex items-center gap-2 text-purple-700 hover:underline text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {loadingInvoice === order.url_facture ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : null}
                        {t("viewInvoice")}
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
          <p className="text-slate-500 py-8">{t("noOrders")}</p>
        )}
      </div>
    </div>
  );
}
