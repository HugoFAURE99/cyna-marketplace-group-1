"use client";

// Compact product card rendered inside the chat from a tool result. Built from
// the slim SearchSuggestion shape (not the async server ProductCard) and links
// to the product page. No cart interaction.
import { ImageOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { formatPriceCents } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/translations";
import type { SearchSuggestion } from "@/lib/products/search-products";

export default function ChatProductCard({
  product,
}: {
  product: SearchSuggestion;
}) {
  const t = useTranslations("product");
  const locale = useLocale() as Locale;

  const period =
    product.type_facturation === "mensuel"
      ? t("perMonth")
      : product.type_facturation === "annuel"
        ? t("perYear")
        : "";
  const unavailable = product.quantite_produit <= 0;

  return (
    <Link
      href={`/products/${product.id_produit}`}
      className="group flex gap-3 rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md"
    >
      <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-slate-100">
        {product.imageUrl ? (
          <div
            role="img"
            aria-label={product.nom_pro}
            className="h-full w-full bg-cover bg-center transition duration-300 group-hover:scale-105"
            style={{ backgroundImage: `url(${JSON.stringify(product.imageUrl)})` }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <ImageOff aria-hidden="true" className="size-5" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {product.cat_nom && (
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-purple-700">
            {product.cat_nom}
          </p>
        )}
        <h4 className="truncate text-sm font-semibold text-slate-950">
          {product.nom_pro}
        </h4>
        <p className="text-xs font-semibold text-purple-700">
          {product.priceCents != null
            ? `${formatPriceCents(product.priceCents, locale)}${period}`
            : t("pricingUnavailable")}
          {unavailable && (
            <span className="ml-1 font-normal text-slate-400">
              · {t("unavailable")}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
