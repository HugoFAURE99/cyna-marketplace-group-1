import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/translations";
import { createServerClient } from "@/lib/supabase/server-client";

export default async function UserEdition({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("user_edition");

  const supabase = await createServerClient();

  // Récupération de l'utilisateur connecté
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let email = authUser?.email || "";

  // Si l'email n'est pas dans authUser, on le cherche dans la table utilisateur
  if (authUser && !email) {
    const { data: dbUser } = await supabase
      .from("utilisateur")
      .select("adresse_mail")
      .eq("id_compte", authUser.id)
      .single();
    if (dbUser && dbUser.adresse_mail) {
      email = dbUser.adresse_mail;
    }
  }

  return (
    <div className="flex flex-col bg-white text-gray-900 font-sans">
      <h1 className="text-3xl font-bold text-black mb-10">{t("title")}</h1>

      <div className="p-10 space-y-12">
        {/* Formulaire pour l'adresse email */}
        <section>
          <h2 className="text-xl font-semibold mb-6">{t("editEmailTitle")}</h2>
          <form className="max-w-md flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="font-medium text-gray-700">
                {t("newEmailLabel")}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                defaultValue={email}
                required
                className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-black outline-none transition-shadow"
                placeholder={t("emailPlaceholder")}
              />
            </div>
            <button
              type="submit"
              className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors self-start"
            >
              {t("updateEmailButton")}
            </button>
          </form>
        </section>

        <hr className="border-gray-100" />

        {/* Formulaire pour le mot de passe */}
        <section>
          <h2 className="text-xl font-semibold mb-6">{t("editPasswordTitle")}</h2>
          <form className="max-w-md flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="font-medium text-gray-700">
                {t("newPasswordLabel")}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-black outline-none transition-shadow"
                placeholder={t("passwordPlaceholder")}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="password_confirm" className="font-medium text-gray-700">
                {t("confirmPasswordLabel")}
              </label>
              <input
                type="password"
                id="password_confirm"
                name="password_confirm"
                required
                className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-black outline-none transition-shadow"
                placeholder={t("passwordPlaceholder")}
              />
            </div>
            <button
              type="submit"
              className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors self-start"
            >
              {t("updatePasswordButton")}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
