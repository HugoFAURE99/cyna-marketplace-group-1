import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/translations";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { UpdatePasswordForm } from "@/components/user-edition/update-password-form";

export default async function UpdatePasswordDashboard({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("user_edition");

  return (
    <div className="flex flex-col sm:p-4">
      <div className="flex items-center gap-4 mb-6 sm:mb-10">
        <Link 
          href="/user-dashboard/infos"
          className="p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 m-0">{t("editPasswordTitle")}</h1>
      </div>

      <div className="sm:p-6 space-y-8 sm:space-y-12 max-w-2xl">
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
