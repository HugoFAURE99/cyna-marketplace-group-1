import { getTranslations, setRequestLocale } from "next-intl/server";

import CategoryForm from "@/components/admin/CategoryForm/CategoryForm";
import { getCategoryById } from "@/app/[locale]/(admin)/admin/_actions/category.actions";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import type { Locale } from "@/lib/i18n/translations";

type PageProps = {
  params: Promise<{ id: string; locale: Locale }>;
};

export default async function CategoryDetailPage({ params }: PageProps) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.categories");
  const tActions = await getTranslations("admin.actions");
  const category = await getCategoryById(Number(id));

  return (
    <div>
      <Link
        href="/admin/categories"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        {tActions("back")}
      </Link>
      <h1>{t("detail")}</h1>
      <CategoryForm category={category} readOnly />
    </div>
  );
}
