// Reusable product card for any listing (home, category, search). Renders the
// image (with category-image / placeholder fallback), name, primary price, and
// an "unavailable" badge when out of stock. Self-contained so it can be dropped
// into any grid.
import { ImageOff } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import AvailabilityBadge from "@/components/product/AvailabilityBadge";
import { Link } from "@/i18n/navigation";
import { formatPriceCents } from "@/lib/i18n/format";
import type { CatalogProduct } from "@/lib/products/public-catalog";

type ProductCardProps = {
  product: CatalogProduct;
};

export default async function ProductCard({ product }: ProductCardProps) {
  const t = await getTranslations("product");
  const th = await getTranslations("home");
  const locale = await getLocale();

  const imageUrl =
    product.images[0]?.lien_image_produit ??
    product.category?.lien_image_cat ??
    null;
  const primaryTariff = product.tariffs[0];
  const isUnavailable = product.quantite_produit <= 0;

  const periodSuffix = (type: string) => {
    if (type === "mensuel") return t("perMonth");
    if (type === "annuel") return t("perYear");
    return "";
  };

  return (
    <Link
      className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md"
      href={`/products/${product.id_produit}`}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
        {imageUrl ? (
          <div
            aria-label={th("productImageAlt", { name: product.nom_pro })}
            className="h-full w-full bg-cover bg-center transition duration-300 group-hover:scale-105"
            role="img"
            style={{ backgroundImage: `url(${JSON.stringify(imageUrl)})` }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-500">
            <ImageOff aria-hidden="true" className="size-8" />
          </div>
        )}
        {isUnavailable && (
          <div className="absolute left-3 top-3">
            <AvailabilityBadge label={t("unavailable")} />
          </div>
        )}
      </div>
      <div className="space-y-1 p-4">
        {product.category?.cat_nom && (
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">
            {product.category.cat_nom}
          </p>
        )}
        <h3 className="text-lg font-semibold text-slate-950">
          {product.nom_pro}
        </h3>
        <p className="text-sm font-semibold text-purple-700">
          {primaryTariff
            ? `${formatPriceCents(primaryTariff.prix, locale)}${periodSuffix(
                primaryTariff.type_facturation,
              )}`
            : t("pricingUnavailable")}
        </p>
      </div>
    </Link>
  );
}
