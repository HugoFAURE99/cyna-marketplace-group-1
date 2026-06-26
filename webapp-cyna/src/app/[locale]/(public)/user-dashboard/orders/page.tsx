import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/translations";
import { createServerClient } from "@/lib/supabase/server-client";
import { OrdersList } from "@/components/account/orders-list";
export default async function Orders({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("orders");
  const supabase = await createServerClient();

  // Récupération de l'utilisateur connecté
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let email = authUser?.email;

  // Si l'email n'est pas dans authUser, on le cherche dans la table utilisateur
  if (authUser && !email) {
    const { data: dbUser } = await supabase
      .from("utilisateur")
      .select("adresse_mail")
      .eq("id_compte", authUser.id)
      .single();
    if (dbUser) {
      email = dbUser.adresse_mail;
    }
  }

  // Récupération des commandes associées à l'email
  let orders: any[] = [];
  if (email) {
    const { data } = await supabase
      .from("commande")
      .select("*")
      .eq("mail_utilisateur_invite", email)
      .order("date_commande", { ascending: false });

    if (data) {
      orders = data;
    }
  }

  return (
    <div className="flex flex-col bg-white text-gray-900 font-sans sm:p-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-black mb-6 sm:mb-10">{t("title")}</h1>

      <OrdersList orders={orders} locale={locale} />
    </div>
  );
}
