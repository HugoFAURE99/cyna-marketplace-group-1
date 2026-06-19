// "Similar Services" grid; renders nothing when there are none.
import { ImageOff } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { SimilarProduct } from "@/lib/products/public-products";

type SimilarProductsProps = {
  products: SimilarProduct[];
};

export default async function SimilarProducts({
  products,
}: SimilarProductsProps) {
  if (products.length === 0) {
    return null;
  }

  const t = await getTranslations("product");

  return (
    <section className="mt-16">
      <h2 className="mb-6 text-2xl font-bold text-slate-950">
        {t("similarServices")}
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const imageUrl =
            product.images[0]?.lien_image_produit ??
            product.category?.lien_image_cat ??
            null;

          return (
            <Link
              className="group overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/10 transition hover:-translate-y-0.5 hover:shadow-md"
              href={`/products/${product.id_produit}`}
              key={product.id_produit}
            >
              <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                {imageUrl ? (
                  <div
                    aria-label={t("imageAlt", { name: product.nom_pro })}
                    className="h-full w-full bg-cover bg-center transition group-hover:scale-105"
                    role="img"
                    style={{
                      backgroundImage: `url(${JSON.stringify(imageUrl)})`,
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-500">
                    <ImageOff className="size-8" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-950">
                  {product.nom_pro}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
