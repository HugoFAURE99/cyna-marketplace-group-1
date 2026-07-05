import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/translations";
import { createServerClient } from "@/lib/supabase/server-client";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { UpdateEmailForm } from "@/components/user-edition/update-email-form";
import { RequestPasswordResetForm } from "@/components/user-edition/request-password-reset-form";

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

  let email = "";

  if (authUser) {
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
    <div className="flex flex-col bg-white text-gray-900 font-sans sm:p-4">
      <div className="flex items-center gap-4 mb-6 sm:mb-10">
        <Link 
          href="/user-dashboard/infos"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-black m-0">{t("title")}</h1>
      </div>

      <div className="sm:p-6 space-y-8 sm:space-y-12">
        {/* Formulaire pour l'adresse email */}
        <UpdateEmailForm initialEmail={email} />

        <hr className="border-gray-100" />

        {/* Formulaire pour demander la réinitialisation du mot de passe */}
        <RequestPasswordResetForm />
      </div>
    </div>
  );
}
