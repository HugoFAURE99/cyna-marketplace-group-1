// Shopping cart page. Reads the cookie-backed cart, enriches each line with
// product data, and renders the editable lines + summary. Cookie-dependent, so
// never cached.
import type { Metadata } from "next";
import { ShoppingCart } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import CartItemCard from "@/components/cart/CartItemCard";
import { Link } from "@/i18n/navigation";
import { getCartView } from "@/lib/cart/cart";
import { formatPriceCents } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/translations";

export const dynamic = "force-dynamic";

type CartPageProps = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({
  params,
}: CartPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cart" });

  return { title: `${t("title")} | CYNA` };
}

export default async function CartPage({ params }: CartPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("cart");
  const { items, subtotalCents } = await getCartView(locale);

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          {t("title")}
        </h1>

        {items.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-purple-50 text-purple-700">
              <ShoppingCart aria-hidden="true" className="size-6" />
            </div>
            <p className="mt-4 text-base font-medium text-slate-900">
              {t("empty")}
            </p>
            <p className="mt-1 text-sm text-slate-500">{t("emptyHint")}</p>
            <Link
              className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-purple-700 px-6 text-sm font-semibold text-white transition hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700"
              href="/search"
            >
              {t("browseProducts")}
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="space-y-4">
              {items.map((item) => (
                <CartItemCard
                  item={item}
                  key={`${item.productId}-${item.tariffId}`}
                />
              ))}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-slate-950">
                  {t("subtotal")}
                </span>
                <span className="text-2xl font-bold text-slate-950">
                  {formatPriceCents(subtotalCents, locale)}
                </span>
              </div>
              <button
                className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-md bg-purple-700 text-base font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled
                title={t("checkoutComingSoon")}
                type="button"
              >
                {t("proceedToCheckout")}
              </button>
              <p className="mt-2 text-center text-xs text-slate-400">
                {t("checkoutComingSoon")}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
              {t.rich("saveCartPrompt", {
                login: (chunks) => (
                  <Link
                    className="font-semibold text-purple-700 transition hover:text-purple-800"
                    href="/login"
                  >
                    {chunks}
                  </Link>
                ),
                register: (chunks) => (
                  <Link
                    className="font-semibold text-purple-700 transition hover:text-purple-800"
                    href="/register"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
