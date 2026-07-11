import { ArrowLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { updateAddress } from "../../actions";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/i18n/translations";
import { createAdminClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase/server-client";

const fieldClass = "w-full rounded-md border border-slate-300 bg-white p-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100";

export default async function EditAddressPage({ params }: { params: Promise<{ id: string; locale: Locale }> }) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  const addressId = Number(id);
  if (!Number.isInteger(addressId) || addressId <= 0) notFound();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();
  const { data: address } = await createAdminClient().from("adresse").select("*").eq("id_adresse", addressId).eq("id_compte", user.id).eq("is_deleted", false).single();
  if (!address) notFound();
  const t = await getTranslations("addresses");
  const action = updateAddress.bind(null, addressId);
  const fields = [
    ["prenom", "firstName", address.prenom], ["nom", "lastName", address.nom],
    ["adresse", "address1", address.adresse], ["adresse_complement", "address2", address.adresse_complement ?? ""],
    ["code_postal", "postalCode", address.code_postal], ["ville", "city", address.ville],
    ["region", "region", address.region ?? ""], ["pays", "country", address.pays],
    ["telephone", "phone", address.telephone ?? ""],
  ] as const;
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link className="rounded-full p-2 hover:bg-slate-100" href="/user-dashboard/addresses"><ArrowLeft className="size-6" /></Link>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">{t("editTitle")}</h1>
      </div>
      <form action={action} className="max-w-2xl space-y-5 rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          {fields.map(([name, label, value]) => (
            <label className={name === "adresse" || name === "adresse_complement" ? "space-y-2 sm:col-span-2" : "space-y-2"} key={name}>
              <span className="text-sm font-medium text-slate-700">{t(label)}</span>
              <input className={fieldClass} defaultValue={value} name={name} required={["prenom", "nom", "adresse", "code_postal", "ville", "pays"].includes(name)} />
            </label>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600"><input defaultChecked={address.is_default} name="is_default" type="checkbox" />{t("makeDefault")}</label>
        <div className="flex gap-3"><button className="rounded-md bg-purple-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-800" type="submit">{t("saveChanges")}</button><Link className="rounded-md border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700" href="/user-dashboard/addresses">{t("cancel")}</Link></div>
      </form>
    </div>
  );
}
