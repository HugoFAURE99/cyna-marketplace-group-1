// Header search box — native GET form that navigates to /<locale>/search?q=...
import { Search } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

export default async function SearchForm() {
  const t = await getTranslations("header");
  const locale = await getLocale();

  return (
    <form
      action={`/${locale}/search`}
      className="relative w-full"
      method="GET"
      role="search"
    >
      <label className="sr-only" htmlFor="public-header-search">
        {t("searchPlaceholder")}
      </label>
      <input
        className="h-11 w-full rounded-md border border-slate-300 bg-white px-4 pr-11 text-sm text-slate-950 shadow-xs outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-0"
        id="public-header-search"
        name="q"
        placeholder={t("searchButton")}
        type="search"
      />
      <button
        aria-label={t("searchButton")}
        className="absolute right-3 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        type="submit"
      >
        <Search aria-hidden="true" className="size-5" />
      </button>
    </form>
  );
}
