"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/browser-client";

export function AddressesList({ addresses }: { addresses: any[] }) {
  const t = useTranslations("addresses");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient();
    const channel = supabase
      .channel('adresse_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'adresse' },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  if (addresses.length === 0) {
    return (
      <div className="col-span-full text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300 w-full">
        <p className="text-slate-500">{t("noAddresses")}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-end mb-6">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`px-3 py-1.5 h-auto ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setViewMode('list')}
            title={t("viewList")}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`px-3 py-1.5 h-auto ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setViewMode('grid')}
            title={t("viewGrid")}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
        {addresses.map((addr) => (
          <div
            key={addr.id_adresse}
            className={`border border-slate-200 rounded-lg p-6 shadow-sm bg-white flex hover:border-slate-300 transition-colors ${viewMode === 'grid' ? 'flex-col' : 'flex-col sm:flex-row justify-between items-start sm:items-center gap-4'}`}
          >
            <div className={`flex flex-col ${viewMode === 'list' ? 'flex-1' : ''}`}>
              <div className="flex justify-between items-start mb-4 gap-4">
                <h3 className="font-bold text-lg text-slate-800">
                  {addr.prenom} {addr.nom}
                </h3>
                {addr.type_adresse && (
                  <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md uppercase font-semibold whitespace-nowrap">
                    {addr.type_adresse}
                  </span>
                )}
              </div>

              <div className="text-slate-600 mb-4 flex-1">
                <p>{addr.adresse}</p>
                {addr.adresse_complement && <p>{addr.adresse_complement}</p>}
                <p>
                  {addr.code_postal} {addr.ville}
                </p>
                <p>{addr.pays}</p>
              </div>

              {addr.telephone && (
                <div className="text-slate-500 text-sm mt-auto pt-4 border-t border-slate-100 flex items-center gap-2">
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
