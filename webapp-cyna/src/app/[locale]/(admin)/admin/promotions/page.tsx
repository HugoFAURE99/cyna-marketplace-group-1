import { getTranslations, setRequestLocale } from "next-intl/server";

import { getPromotions } from "@/app/[locale]/(admin)/admin/_actions/promotion.actions";
import PromotionsTableClient from "@/components/admin/PromotionsTable/PromotionsTableClient";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/i18n/translations";

export default async function PromotionsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tPromo = await getTranslations("admin.promotions");
  const promotions = await getPromotions();

  const translations = {
    title: tPromo("title"),
    add: tPromo("add"),
    search: tPromo("search"),
    allStatuses: tPromo("allStatuses"),
    active: tPromo("active"),
    inactive: tPromo("inactive"),
    allTypes: tPromo("allTypes"),
    percentage: tPromo("percentage"),
    fixed: tPromo("fixed"),
    id: tPromo("id"),
    type: tPromo("type"),
    value: tPromo("value"),
    expiration: tPromo("expiration"),
    status: tPromo("status"),
    code: tPromo("code"),
    targets: tPromo("targets"),
    actions: tPromo("actions"),
    noPromotions: tPromo("noPromotions"),
    view: tPromo("view"),
    delete: tPromo("delete"),
    confirmDeleteTitle: tPromo("confirmDeleteTitle"),
    confirmDeleteMessage: tPromo("confirmDeleteMessage"),
    confirmDelete: tPromo("confirmDelete"),
    cancelDelete: tPromo("cancelDelete"),
    deleting: tPromo("deleting"),
    cannotDeleteTitle: tPromo("cannotDeleteTitle"),
    cannotDeleteMessage: tPromo("cannotDeleteMessage"),
    deactivateInstead: tPromo("deactivateInstead"),
    close: tPromo("close"),
    automatic: tPromo("automatic"),
    codePromo: tPromo("codePromo"),
    products: tPromo("products"),
    categories: tPromo("categories"),
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{translations.title}</h1>
        <Button nativeButton={false} render={<Link href="/admin/promotions/new" />}>
          {translations.add}
        </Button>
      </div>
      <PromotionsTableClient promotions={promotions} translations={translations} />
    </div>
  );
}
