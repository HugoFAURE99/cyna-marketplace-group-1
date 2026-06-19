// "Top Products" grid — renders a ProductCard per product.
import { getTranslations } from "next-intl/server";

import ProductCard from "@/components/product/ProductCard";
import type { CatalogProduct } from "@/lib/products/public-catalog";

type ProductGridProps = {
  products: CatalogProduct[];
};

export default async function ProductGrid({ products }: ProductGridProps) {
  const t = await getTranslations("home");

  return (
    <section aria-labelledby="top-products" className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-normal text-purple-700">
          {t("servicesEyebrow")}
        </p>
        <h2 id="top-products" className="text-2xl font-bold text-slate-950">
          {t("topProducts")}
        </h2>
      </div>

      {products.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id_produit} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          {t("noProducts")}
        </div>
      )}
    </section>
  );
}
