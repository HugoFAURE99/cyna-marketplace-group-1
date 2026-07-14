import { getTranslations, setRequestLocale } from "next-intl/server";

import { getProducts, getCategories } from "@/app/[locale]/(admin)/admin/_actions/product.actions";
import ProductsPageTabs from "@/components/admin/ProductsTable/ProductsPageTabs";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/i18n/translations";

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.products");
  const tTable = await getTranslations("admin.products.table");
  const tActions = await getTranslations("admin.actions");
  const tPriority = await getTranslations("admin.priority");
  const tTabs = await getTranslations("admin.tabs");
  const tFeatured = await getTranslations("admin.featured");
  const tProduct = await getTranslations("product");
  const [products, categoriesRaw] = await Promise.all([
    getProducts(locale),
    getCategories(locale).catch(() => []),
  ]);
  const categories = (categoriesRaw ?? []).map((c) => ({
    id: c.id_categorie,
    name: c.cat_nom,
  }));

  const productsTableTranslations = {
    image: tTable("image"),
    name: tTable("name"),
    category: tTable("category"),
    status: tTable("status"),
    priceMonthly: tTable("priceMonthly"),
    priceAnnual: tTable("priceAnnual"),
    actions: tTable("actions"),
    priority: tTable("priority"),
    stock: tTable("stock"),
    active: tTable("active"),
    inactive: tTable("inactive"),
    edit: tActions("edit"),
  };

  const priorityTranslations = {
    title: tPriority("title"),
    image: tTable("image"),
    name: tTable("name"),
    category: tTable("category"),
    order: tPriority("order"),
    validate: tPriority("validate"),
    validating: tPriority("validating"),
    noProducts: tPriority("noProducts"),
    dragHint: tPriority("dragHint"),
    unsavedTitle: tPriority("unsavedTitle"),
    unsavedMessage: tPriority("unsavedMessage"),
    unsavedLeave: tPriority("unsavedLeave"),
    unsavedStay: tPriority("unsavedStay"),
    cancel: tPriority("cancel"),
  };

  const featuredTranslations = {
    title: tFeatured("title"),
    validate: tFeatured("validate"),
    validating: tFeatured("validating"),
    dragHint: tFeatured("dragHint"),
    addProduct: tFeatured("addProduct"),
    removeProduct: tFeatured("removeProduct"),
    emptySlot: tFeatured("emptySlot"),
    pickerTitle: tFeatured("pickerTitle"),
    pickerSearch: tFeatured("pickerSearch"),
    pickerName: tFeatured("pickerName"),
    pickerCategory: tFeatured("pickerCategory"),
    pickerPrice: tFeatured("pickerPrice"),
    pickerNoResults: tFeatured("pickerNoResults"),
    pickerSelect: tFeatured("pickerSelect"),
    allCategories: tTabs("allCategories"),
    unsavedTitle: tPriority("unsavedTitle"),
    unsavedMessage: tPriority("unsavedMessage"),
    unsavedLeave: tPriority("unsavedLeave"),
    unsavedStay: tPriority("unsavedStay"),
    confirmRemoveTitle: tFeatured("confirmRemoveTitle"),
    confirmRemoveMessage: tFeatured("confirmRemoveMessage", { name: "{name}" }),
    confirmRemove: tFeatured("confirmRemove"),
    cancelRemove: tFeatured("cancelRemove"),
    cancel: tFeatured("cancel"),
    close: tFeatured("close"),
    dragProduct: tFeatured("dragProduct"),
    perMonth: tFeatured("perMonth"),
    perYear: tFeatured("perYear"),
    promotionBadge: tProduct("promotionBadge", { discount: "{discount}" }),
  };

  const tabsTranslations = {
    products: tTabs("products"),
    priorityOrder: tTabs("priorityOrder"),
    featuredOrder: tTabs("featuredOrder"),
    featuredEmpty: tTabs("featuredEmpty"),
    unsavedTitle: tPriority("unsavedTitle"),
    unsavedMessage: tPriority("unsavedMessage"),
    unsavedLeave: tPriority("unsavedLeave"),
    unsavedStay: tPriority("unsavedStay"),
    unsavedSaveAndLeave: tPriority("unsavedSaveAndLeave"),
    allCategories: tTabs("allCategories"),
    filterByCategory: tTabs("filterByCategory"),
    searchPlaceholder: tTabs("searchPlaceholder"),
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button className="w-full sm:w-auto" nativeButton={false} render={<Link href="/admin/products/new" />}>
          {t("add")}
        </Button>
      </div>
      <ProductsPageTabs
        products={products}
        categories={categories}
        productsTableTranslations={productsTableTranslations}
        priorityTranslations={priorityTranslations}
        featuredTranslations={featuredTranslations}
        tabsTranslations={tabsTranslations}
      />
    </div>
  );
}
