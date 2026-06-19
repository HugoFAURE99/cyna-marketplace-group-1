// Fixed public site header: logo, search, cart, and the menu drawer.
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import CartButton from "@/components/layout/public-header/CartButton";
import CategoryNavBar from "@/components/layout/public-header/CategoryNavBar";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher/LanguageSwitcher";
import PublicMenuSheet from "@/components/layout/public-header/PublicMenuSheet";
import SearchAutocomplete from "@/components/layout/public-header/SearchAutocomplete";
import { getCartCount } from "@/lib/cart/cart";

export default async function PublicHeader() {
  const t = await getTranslations("header");
  const cartCount = await getCartCount();

  // 2. On récupère la session de l'utilisateur actuel
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
      {/* logo | search | actions. Search is centered in the flex-1 track between
          logo and actions, so its gap to each side stays even despite their
          different widths. */}
      <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex shrink-0 items-center gap-3">
          <Link
            aria-label={t("homeAriaLabel")}
            className="inline-flex w-fit shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            href="/"
          >
            <Image
              alt="CYNA"
              className="h-auto w-[118px]"
              height={32}
              priority
              src="/brand/cyna-logo-v2-header.svg"
              width={118}
            />
          </Link>
        </div>

        <div className="hidden min-w-0 flex-1 md:block">
          <div className="mx-auto w-full max-w-[600px]">
            <SearchAutocomplete />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <LanguageSwitcher />
          <CartButton count={cartCount} />

          {/* 3. On transmet l'état (true si user existe, false sinon) */}
          <PublicMenuSheet isLoggedIn={!!user} />
        </div>
      </div>

      <CategoryNavBar />
    </header>
  );
}
