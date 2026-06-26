"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

export function OrdersList({ orders, locale }: { orders: any[], locale: string }) {
  const t = useTranslations("orders");
  const [search, setSearch] = useState("");

  const filteredOrders = orders.filter((order) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      order.id_commande.toString().includes(term) ||
      (order.statut_commande && order.statut_commande.toLowerCase().includes(term)) ||
      (order.montant_total && order.montant_total.toString().includes(term))
    );
  });

  return (
    <div className="w-full">
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder={t("searchPlaceholder")}
          className="pl-10 w-full max-w-md bg-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto w-full">
        {filteredOrders.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="pb-4 font-bold text-gray-700">ID Commande</th>
                <th className="pb-4 font-bold text-gray-700">Date</th>
                <th className="pb-4 font-bold text-gray-700">Montant</th>
                <th className="pb-4 font-bold text-gray-700">Statut</th>
                <th className="pb-4 font-bold text-gray-700">Facture</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id_commande} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 text-gray-600">#{order.id_commande}</td>
                  <td className="py-4 text-gray-600">
                    {new Date(order.date_commande).toLocaleDateString(locale)}
                  </td>
                  <td className="py-4 text-gray-600 font-semibold">{order.montant_total} €</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${order.statut_commande === 'payée' || order.statut_commande === 'payee' || order.statut_commande === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                      }`}>
                      {order.statut_commande}
                    </span>
                  </td>
                  <td className="py-4">
                    {order.url_facture ? (
                      <a
                        href={order.url_facture}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm font-medium"
                      >
                        Voir la facture
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : search ? (
          <p className="text-gray-500 py-8">{t("noSearchResults", { search })}</p>
        ) : (
          <p className="text-gray-500 py-8">{t("noOrders")}</p>
        )}
      </div>
    </div>
  );
}
