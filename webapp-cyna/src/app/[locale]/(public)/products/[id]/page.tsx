// Public product detail page: gallery, info, pricing, and similar products.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import AvailabilityBadge from "@/components/product/AvailabilityBadge";
import ContactSalesInfo from "@/components/product/ContactSalesInfo";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import ProductPricingCard from "@/components/product/ProductPricingCard";
import SimilarProducts from "@/components/product/SimilarProducts";
import { Link } from "@/i18n/navigation";
import {
  getPublicProductById,
  getSimilarProducts,
} from "@/lib/products/public-products";
import type { Locale } from "@/lib/i18n/translations";

type ProductPageProps = {
  params: Promise<{ id: string; locale: Locale }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const productId = parseProductId(id);
  const t = await getTranslations({ locale, namespace: "product" });
  const notFoundTitle = `${t("notFound")} | CYNA`;

  if (!productId) {
    return { title: notFoundTitle };
  }

  const product = await getPublicProductById(productId, locale);

  if (!product) {
    return { title: notFoundTitle };
  }

  return {
    title: `${product.nom_pro} | CYNA`,
    description: product.pro_description ?? undefined,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  const productId = parseProductId(id);

  if (!productId) {
    notFound();
  }

  const product = await getPublicProductById(productId, locale);

  if (!product) {
    notFound();
  }

  const similarProducts = await getSimilarProducts(
    product.id_produit,
    product.id_categorie,
    locale,
  );

  const t = await getTranslations("product");

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10">
          {/* Main column: gallery + description + specs flow here. */}
          <div className="space-y-8">
            <ProductGallery
              fallbackImageUrl={product.category?.lien_image_cat ?? null}
              images={product.images}
              productName={product.nom_pro}
            />
            <ProductInfo
              description={product.pro_description}
              specs={product.specs}
            />
          </div>

          {/* Buy box: stays in view while the details scroll. */}
          <aside className="space-y-5 lg:sticky lg:top-[88px]">
            <div className="space-y-2">
              {product.category && (
                <Link
                  className="inline-block text-xs font-semibold uppercase tracking-wide text-purple-700 transition hover:text-purple-900"
                  href={`/search?category=${product.category.id_categorie}`}
                >
                  {product.category.cat_nom}
                </Link>
              )}
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
                {product.nom_pro}
              </h1>
              {product.quantite_produit > 0 ? (
                <p className="text-sm font-medium text-emerald-700">
                  {t("quantityAvailable", { count: product.quantite_produit })}
                </p>
              ) : (
                <div className="space-y-2">
                  <AvailabilityBadge label={t("unavailable")} />
                  <ContactSalesInfo />
                </div>
              )}
            </div>
            <ProductPricingCard
              isUnavailable={product.quantite_produit <= 0}
              productId={product.id_produit}
              tariffs={product.tariffs}
            />
          </aside>
        </section>

        <SimilarProducts products={similarProducts} />
      </div>
    </main>
  );
}

// Reject non-numeric or non-positive ids so they 404 instead of querying.
function parseProductId(value: string) {
  const productId = Number(value);

  if (!Number.isInteger(productId) || productId <= 0) {
    return null;
  }

  return productId;
}
