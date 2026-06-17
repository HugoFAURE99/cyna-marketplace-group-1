// "Top Products" grid linking each card to its product page.
import { ImageOff } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { formatPriceCents } from "@/lib/i18n/format";
import type { HomeProduct } from "@/lib/home/public-home";

type ProductGridProps = {
  products: HomeProduct[];
};

export default async function ProductGrid({ products }: ProductGridProps) {
  const t = await getTranslations("home");
  const tp = await getTranslations("product");
  const locale = await getLocale();

  const periodSuffix = (type: string) => {
    if (type === "mensuel") return tp("perMonth");
    if (type === "annuel") return tp("perYear");
    return "";
  };

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
          {products.map((product) => {
            const imageUrl =
              product.images[0]?.lien_image_produit ??
              product.category?.lien_image_cat ??
              null;
            const primaryTariff = product.tariffs[0];

            return (
              <Link
                className="group overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200"
                href={`/products/${product.id_produit}`}
                key={product.id_produit}
              >
                <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                  {imageUrl ? (
                    <div
                      aria-label={t("productImageAlt", { name: product.nom_pro })}
                      className="h-full w-full bg-cover bg-center transition duration-300 group-hover:scale-105"
                      role="img"
                      style={{ backgroundImage: `url(${JSON.stringify(imageUrl)})` }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-500">
                      <ImageOff aria-hidden="true" className="size-8" />
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <h3 className="text-lg font-semibold text-slate-950">
                    {product.nom_pro}
                  </h3>
                  <p className="text-sm font-semibold text-purple-700">
                    {primaryTariff
                      ? `${formatPriceCents(primaryTariff.prix, locale)}${periodSuffix(
                          primaryTariff.type_facturation,
                        )}`
                      : tp("pricingUnavailable")}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          {t("noProducts")}
        </div>
      )}
    </section>
  );
}
