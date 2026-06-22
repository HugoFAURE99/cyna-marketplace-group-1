import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/translations";
import { Link } from "@/i18n/navigation";

export default async function NewAddress({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("addresses");

  return (
    <div className="flex flex-col bg-white text-gray-900 font-sans p-6 lg:p-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-black mb-2">{t("newTitle")}</h1>
      </div>

      <div className="max-w-2xl bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <form className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="prenom" className="font-medium text-gray-700">
                {t("firstName")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="prenom"
                name="prenom"
                required
                className="border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black outline-none transition-shadow"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="nom" className="font-medium text-gray-700">
                {t("lastName")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nom"
                name="nom"
                required
                className="border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black outline-none transition-shadow"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="adresse" className="font-medium text-gray-700">
              {t("address1")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="adresse"
              name="adresse"
              required
              className="border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black outline-none transition-shadow"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="adresse_complement" className="font-medium text-gray-700">
              {t("address2")}
            </label>
            <input
              type="text"
              id="adresse_complement"
              name="adresse_complement"
              className="border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black outline-none transition-shadow"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="code_postal" className="font-medium text-gray-700">
                {t("postalCode")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="code_postal"
                name="code_postal"
                required
                className="border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black outline-none transition-shadow"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="ville" className="font-medium text-gray-700">
                {t("city")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="ville"
                name="ville"
                required
                className="border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black outline-none transition-shadow"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="region" className="font-medium text-gray-700">
                {t("region")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="region"
                name="region"
                required
                className="border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black outline-none transition-shadow"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="pays" className="font-medium text-gray-700">
                {t("country")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="pays"
                name="pays"
                required
                className="border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black outline-none transition-shadow"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="telephone" className="font-medium text-gray-700">
              {t("phone")} <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="telephone"
              name="telephone"
              required
              className="border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black outline-none transition-shadow"
            />
            <p className="text-sm text-gray-500 mt-1">{t("phoneHint")}</p>
          </div>

          <div className="flex items-center gap-4 mt-6 pt-6 border-t border-gray-100">
            <button
              type="submit"
              className="bg-black text-white px-8 py-3 rounded-full hover:bg-gray-800 transition-colors shadow-md hover:shadow-lg font-medium"
            >
              {t("submitNew")}
            </button>
            <Link
              href="/user-dashboard/addresses"
              className="px-6 py-3 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              {t("cancel")}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
