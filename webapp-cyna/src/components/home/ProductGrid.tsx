// "Top Products" grid linking each card to its product page.
import Link from "next/link";
import { ImageOff } from "lucide-react";

import type { HomeProduct } from "@/lib/home/public-home";

type ProductGridProps = {
  products: HomeProduct[];
};

export default function ProductGrid({ products }: ProductGridProps) {
  return (
    <section aria-labelledby="top-products" className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-normal text-purple-700">
          Services
        </p>
        <h2 id="top-products" className="text-2xl font-bold text-slate-950">
          Top Products
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
          No public products are available yet.
        </div>
      )}
    </section>
  );
}

function ProductCard({ product }: { product: HomeProduct }) {
  const imageUrl =
    product.images[0]?.lien_image_produit ??
    product.category?.lien_image_cat ??
    null;
  const primaryTariff = product.tariffs[0];

  return (
    <Link
      className="group overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200"
      href={`/products/${product.id_produit}`}
    >
      <div className="aspect-[16/9] overflow-hidden bg-slate-100">
        {imageUrl ? (
          <div
            aria-label={`${product.nom_pro} image`}
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
            ? `${formatEuroCents(primaryTariff.prix)}${getTariffPeriodSuffix(
                primaryTariff.type_facturation,
              )}`
            : "Pricing unavailable"}
        </p>
      </div>
    </Link>
  );
}

function getTariffPeriodSuffix(type: string) {
  switch (type) {
    case "mensuel":
      return "/mo";
    case "annuel":
      return "/yr";
    default:
      return "";
  }
}

// Prices are stored as integer cents; show euros and hide a trailing ".00".
function formatEuroCents(cents: number) {
  const amount = cents / 100;
  const hasCents = cents % 100 !== 0;

  return `\u20ac${amount.toLocaleString("en-US", {
    maximumFractionDigits: hasCents ? 2 : 0,
    minimumFractionDigits: hasCents ? 2 : 0,
  })}`;
}
