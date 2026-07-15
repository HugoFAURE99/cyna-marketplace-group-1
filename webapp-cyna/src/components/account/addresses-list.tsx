"use client";

import { useTransition } from "react";
import { Check, Edit3, Star, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { deleteAddress, setDefaultAddress } from "@/app/[locale]/(public)/user-dashboard/addresses/actions";
import { Link } from "@/i18n/navigation";
import type { Tables } from "@/types/database.types";

export function AddressesList({ addresses }: { addresses: Tables<"adresse">[] }) {
  const t = useTranslations("addresses");
  const [isPending, startTransition] = useTransition();

  if (addresses.length === 0) {
    return (
      <div className="w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center">
        <p className="text-slate-500">{t("noAddresses")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {addresses.map((address) => (
        <article className="flex flex-col rounded-lg border border-slate-200 bg-white p-6" key={address.id_adresse}>
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900">{address.prenom} {address.nom}</h2>
            {address.is_default && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                <Check aria-hidden="true" className="size-3.5" />{t("default")}
              </span>
            )}
          </div>
          <address className="mt-4 flex-1 not-italic leading-6 text-slate-600">
            <p>{address.adresse}</p>
            {address.adresse_complement && <p>{address.adresse_complement}</p>}
            <p>{address.code_postal} {address.ville}</p>
            {address.region && <p>{address.region}</p>}
            <p>{address.pays}</p>
            {address.telephone && <p className="mt-2 text-sm">{address.telephone}</p>}
          </address>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <Link className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 active:bg-slate-100" href={`/user-dashboard/addresses/${address.id_adresse}/edit`}>
              <Edit3 aria-hidden="true" className="size-4" />{t("edit")}
            </Link>
            {!address.is_default && (
              <button className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50" disabled={isPending} onClick={() => startTransition(() => setDefaultAddress(address.id_adresse))} type="button">
                <Star aria-hidden="true" className="size-4" />{t("makeDefault")}
              </button>
            )}
            <button className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 active:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50" disabled={isPending} onClick={() => {
              if (window.confirm(t("deleteConfirm"))) startTransition(() => deleteAddress(address.id_adresse));
            }} type="button">
              <Trash2 aria-hidden="true" className="size-4" />{t("delete")}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
