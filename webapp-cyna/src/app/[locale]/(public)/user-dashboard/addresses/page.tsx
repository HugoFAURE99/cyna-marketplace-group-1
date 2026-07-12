import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/translations";
import { createServerClient } from "@/lib/supabase/server-client";
import { Link } from "@/i18n/navigation";
import { Plus } from "lucide-react";
import { AddressesList } from "@/components/account/addresses-list";
import type { Tables } from "@/types/database.types";

export default async function Addresses({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("addresses");
  const supabase = await createServerClient();

  // Récupération de l'utilisateur connecté
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let addresses: Tables<"adresse">[] = [];

  if (authUser) {
    const { data, error } = await supabase
      .from("adresse")
      .select("*")
      .eq("id_compte", authUser.id)
      .eq("is_deleted", false)
      .order("id_adresse", { ascending: false });

    if (error) throw new Error(`ADDRESS_LIST_QUERY_FAILED: ${error.message}`);
    addresses = data ?? [];
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          {t("title")}
        </h1>
        <Link
          href="/user-dashboard/addresses/new"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-purple-700 px-5 text-sm font-semibold text-white transition hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 sm:w-auto"
        >
          <Plus className="size-4" />
          {t("addNew")}
        </Link>
      </div>

      <AddressesList addresses={addresses} />
    </div>
  );
}
