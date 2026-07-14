import type { Metadata } from "next";
import { ImageOff, SlidersHorizontal } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import ProductCard from "@/components/product/ProductCard";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/i18n/translations";
import {
  getCatalogCategoryById,
  getCatalogProducts,
} from "@/lib/products/public-catalog";

type CategoryPageProps = {
  params: Promise<{ id: string; locale: Locale }>;
};

function parseCategoryId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const categoryId = parseCategoryId(id);
  const t = await getTranslations({ locale, namespace: "categoryPage" });
  if (!categoryId) return { title: `${t("notFound")} | CYNA` };

  const category = await getCatalogCategoryById(categoryId, locale);
  if (!category) return { title: `${t("notFound")} | CYNA` };
  return {
    title: `${category.cat_nom} | CYNA`,
    description: category.cat_description ?? undefined,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  const categoryId = parseCategoryId(id);
  if (!categoryId) notFound();

  const [category, products] = await Promise.all([
    getCatalogCategoryById(categoryId, locale),
    getCatalogProducts(locale, [categoryId]),
  ]);
  if (!category) notFound();

  const t = await getTranslations("categoryPage");

  return (
    <main className="flex-1">
      <section className="relative isolate min-h-72 overflow-hidden bg-slate-950 text-white sm:min-h-80">
        {category.lien_image_cat ? (
          <div
            aria-label={t("imageAlt", { name: category.cat_nom })}
            className="absolute inset-0 -z-20 bg-cover bg-center"
            role="img"
            style={{
              backgroundImage: `url(${JSON.stringify(category.lien_image_cat)})`,
            }}
          />
        ) : (
          <div className="absolute inset-0 -z-20 flex items-center justify-center bg-slate-800 text-slate-500">
            <ImageOff aria-hidden="true" className="size-14" />
          </div>
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/30" />
        <div className="mx-auto flex min-h-72 w-full max-w-7xl items-end px-4 py-10 sm:min-h-80 sm:px-6 sm:py-14 lg:px-8">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wider text-purple-200">
              {t("eyebrow")}
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              {category.cat_nom}
            </h1>
            {category.cat_description && (
              <p className="max-w-xl text-base leading-7 text-slate-100 sm:text-lg">
                {category.cat_description}
              </p>
            )}
            <p className="text-sm font-medium text-slate-200">
              {t("productCount", { count: products.length })}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-slate-950">{t("products")}</h2>
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-xs transition hover:border-purple-300 hover:text-purple-700"
            href={`/search?category=${category.id_categorie}`}
          >
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            {t("advancedFilters")}
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id_produit} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="font-medium text-slate-900">{t("empty")}</p>
            <p className="mt-1 text-sm text-slate-500">{t("emptyHint")}</p>
          </div>
        )}
      </section>
    </main>
  );
}
