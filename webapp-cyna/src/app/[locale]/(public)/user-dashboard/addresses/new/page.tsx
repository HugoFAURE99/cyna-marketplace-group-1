import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/translations";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { addAddress } from "./actions";

export default async function NewAddress({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("addresses");

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-4 mb-10">
        <Link 
          href="/user-dashboard/addresses"
          className="p-2 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 m-0">{t("newTitle")}</h1>
      </div>

      <div className="max-w-2xl rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
        <form action={addAddress} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="prenom" className="font-medium text-slate-700">
                {t("firstName")} <span className="text-purple-700">*</span>
              </label>
              <input
                type="text"
                id="prenom"
                name="prenom"
                required
                className="border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-black outline-none transition-shadow"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="nom" className="font-medium text-slate-700">
                {t("lastName")} <span className="text-purple-700">*</span>
              </label>
              <input
                type="text"
                id="nom"
                name="nom"
                required
                className="border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-black outline-none transition-shadow"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="adresse" className="font-medium text-slate-700">
              {t("address1")} <span className="text-purple-700">*</span>
            </label>
            <input
              type="text"
              id="adresse"
              name="adresse"
              required
              className="border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-black outline-none transition-shadow"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="adresse_complement" className="font-medium text-slate-700">
              {t("address2")}
            </label>
            <input
              type="text"
              id="adresse_complement"
              name="adresse_complement"
              className="border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-black outline-none transition-shadow"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="code_postal" className="font-medium text-slate-700">
                {t("postalCode")} <span className="text-purple-700">*</span>
              </label>
              <input
                type="text"
                id="code_postal"
                name="code_postal"
                required
                className="border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-black outline-none transition-shadow"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="ville" className="font-medium text-slate-700">
                {t("city")} <span className="text-purple-700">*</span>
              </label>
              <input
                type="text"
                id="ville"
                name="ville"
                required
                className="border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-black outline-none transition-shadow"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="region" className="font-medium text-slate-700">
                {t("region")}
              </label>
              <input
                type="text"
                id="region"
                name="region"
                className="border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-black outline-none transition-shadow"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="pays" className="font-medium text-slate-700">
                {t("country")} <span className="text-purple-700">*</span>
              </label>
              <input
                type="text"
                id="pays"
                name="pays"
                required
                className="border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-black outline-none transition-shadow"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="telephone" className="font-medium text-slate-700">
              {t("phone")}
            </label>
            <input
              type="tel"
              id="telephone"
              name="telephone"
              className="border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-black outline-none transition-shadow"
            />
            <p className="text-sm text-slate-500 mt-1">{t("phoneHint")}</p>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input name="is_default" type="checkbox" />
            {t("makeDefault")}
          </label>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center">
            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-purple-700 px-6 text-sm font-semibold text-white transition hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 sm:w-auto"
            >
              {t("submitNew")}
            </button>
            <Link
              href="/user-dashboard/addresses"
              className="inline-flex h-11 w-full items-center justify-center rounded-md border border-slate-300 px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 sm:w-auto"
            >
              {t("cancel")}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
