"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";

export function AddressesList({ addresses }: { addresses: any[] }) {
  const t = useTranslations("addresses");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  if (addresses.length === 0) {
    return (
      <div className="col-span-full text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300 w-full">
        <p className="text-gray-500">{t("noAddresses")}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-end mb-6">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`px-3 py-1.5 h-auto ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setViewMode('list')}
            title="Vue Liste"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`px-3 py-1.5 h-auto ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setViewMode('grid')}
            title="Vue Grille"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
        {addresses.map((addr) => (
          <div
            key={addr.id_adresse}
            className={`border border-gray-200 rounded-2xl p-6 shadow-sm bg-white flex hover:border-gray-300 transition-colors ${viewMode === 'grid' ? 'flex-col' : 'flex-col sm:flex-row justify-between items-start sm:items-center gap-4'}`}
          >
            <div className={`flex flex-col ${viewMode === 'list' ? 'flex-1' : ''}`}>
              <div className="flex justify-between items-start mb-4 gap-4">
                <h3 className="font-bold text-lg text-gray-800">
                  {addr.prenom} {addr.nom}
                </h3>
                {addr.type_adresse && (
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md uppercase font-semibold whitespace-nowrap">
                    {addr.type_adresse}
                  </span>
                )}
              </div>

              <div className="text-gray-600 mb-4 flex-1">
                <p>{addr.adresse}</p>
                {addr.adresse_complement && <p>{addr.adresse_complement}</p>}
                <p>
                  {addr.code_postal} {addr.ville}
                </p>
                <p>{addr.pays}</p>
              </div>

              {addr.telephone && (
                <div className="text-gray-500 text-sm mt-auto pt-4 border-t border-gray-100 flex items-center gap-2">
                  <span>📞</span>
                  <span>{addr.telephone}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
