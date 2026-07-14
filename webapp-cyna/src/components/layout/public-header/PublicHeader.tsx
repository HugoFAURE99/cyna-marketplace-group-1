// Fixed public site header: logo, search, cart, and the menu drawer.
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { CircleUserRound, LogIn } from "lucide-react";

import { Link } from "@/i18n/navigation";
import CartButton from "@/components/layout/public-header/CartButton";
import CategoryMenu from "@/components/layout/public-header/CategoryMenu";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher/LanguageSwitcher";
import MobileSearch from "@/components/layout/public-header/MobileSearch";
import PublicMenuSheet from "@/components/layout/public-header/PublicMenuSheet";
import SearchAutocomplete from "@/components/layout/public-header/SearchAutocomplete";
import { getCartCount } from "@/lib/cart/cart";
import { A11yProvider } from "@/components/layout/public-header/A11yMenu";
import { getCatalogCategories } from "@/lib/products/public-catalog";
import { getLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/translations";
import { createServerClient } from "@/lib/supabase/server-client";
import { isActiveAdmin } from "@/lib/auth/roles";

export default async function PublicHeader() {
  const t = await getTranslations("header");
  const locale = (await getLocale()) as Locale;
  const cartCount = await getCartCount();
  const categories = await getCatalogCategories(locale);

  // 2. On récupère la session de l'utilisateur actuel
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2b. Nom affiché : on lit le profil (RLS autorise l'utilisateur à voir le
  // sien), avec repli sur la partie locale de l'e-mail.
  let displayName: string | null = null;
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("utilisateur")
      .select("nom_complet, role, is_actif")
      .eq("id_compte", user.id)
      .maybeSingle();
    displayName = profile?.nom_complet ?? user.email?.split("@")[0] ?? null;
    isAdmin = isActiveAdmin(profile);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
      <A11yProvider />
      {/* logo | search | actions. Search is centered in the flex-1 track between
          logo and actions, so its gap to each side stays even despite their
          different widths. */}
      <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between gap-1 px-3 sm:gap-3 sm:px-6 lg:px-8">
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            aria-label={t("homeAriaLabel")}
            className="inline-flex w-fit shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            href="/"
          >
            <Image
              alt="CYNA"
              className="h-auto w-[104px] sm:w-[118px]"
              height={32}
              priority
              src="/brand/cyna-logo-v2-header.svg"
              width={118}
            />
          </Link>

          <span
            aria-hidden="true"
            className="hidden h-6 w-px bg-slate-200 sm:block"
          />
          <div className="hidden md:block"><CategoryMenu categories={categories} /></div>
        </div>

        <div className="hidden min-w-0 flex-1 md:block">
          <div className="mx-auto w-full max-w-[600px]">
            <SearchAutocomplete />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* État de connexion (visible sur écrans ≥ sm) */}
          {user ? (
            <Link
              className="hidden h-11 max-w-[200px] items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-xs transition hover:border-purple-200 hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 lg:inline-flex"
              href="/user-dashboard/infos"
            >
              <CircleUserRound
                aria-hidden="true"
                className="size-5 shrink-0 text-purple-700"
              />
              <span className="truncate">{displayName}</span>
            </Link>
          ) : (
            <Link
              className="hidden h-11 items-center gap-1.5 rounded-md bg-purple-700 px-4 text-sm font-semibold text-white shadow-xs transition hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 lg:inline-flex"
              href="/login"
            >
              <LogIn aria-hidden="true" className="size-4" />
              {t("logIn")}
            </Link>
          )}

          <MobileSearch />
          <div className="hidden md:block"><LanguageSwitcher /></div>
          <CartButton count={cartCount} />

          <PublicMenuSheet categories={categories} isAdmin={isAdmin} isLoggedIn={!!user} />
        </div>
      </div>
    </header>
  );
}
