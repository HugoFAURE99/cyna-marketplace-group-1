// Category quick-links shown beneath the main header row. A horizontally
// scrollable strip so it works on every screen size. Always renders at least
// the "All products" link, which keeps the header height constant.
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/i18n/translations";
import { getCatalogCategories } from "@/lib/products/public-catalog";

const linkClassName =
  "inline-flex items-center whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-purple-50 hover:text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700";

export default async function CategoryNavBar() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("header");
  const categories = await getCatalogCategories(locale);

  return (
    <nav
      aria-label={t("categoriesNav")}
      className="border-t border-slate-100 bg-white"
    >
      <div className="mx-auto flex w-full max-w-6xl justify-center px-4 sm:px-6 lg:px-8">
        <ul className="flex h-11 w-max max-w-full items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <li className="shrink-0">
            <Link className={linkClassName} href="/search">
              {t("allProducts")}
            </Link>
          </li>
          {categories.map((category) => (
            <li className="shrink-0" key={category.id_categorie}>
              <Link
                className={linkClassName}
                href={`/search?category=${category.id_categorie}`}
              >
                {category.cat_nom}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
