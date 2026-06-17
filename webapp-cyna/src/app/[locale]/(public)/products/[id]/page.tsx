// Public product detail page: gallery, info, pricing, and similar products.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import ProductPricingCard from "@/components/product/ProductPricingCard";
import SimilarProducts from "@/components/product/SimilarProducts";
import {
  getFeaturedSimilarProducts,
  getPublicProductById,
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

  const [product, similarProducts] = await Promise.all([
    getPublicProductById(productId, locale),
    getFeaturedSimilarProducts(productId, locale),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-purple-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,608px)] lg:items-start">
          <ProductGallery
            fallbackImageUrl={product.category?.lien_image_cat ?? null}
            images={product.images}
            productName={product.nom_pro}
          />

          <div className="space-y-6">
            <ProductInfo
              description={product.pro_description}
              name={product.nom_pro}
              specs={product.specs}
            />
            <ProductPricingCard tariffs={product.tariffs} />
          </div>
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
