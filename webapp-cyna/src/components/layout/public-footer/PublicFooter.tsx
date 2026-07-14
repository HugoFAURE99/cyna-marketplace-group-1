import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

const footerLinks = [
  { href: "/about", labelKey: "aboutCyna" },
  { href: "/faq", labelKey: "faq" },
  { href: "/legal", labelKey: "legalNotices" },
  { href: "/terms", labelKey: "termsOfUse" },
] as const;

export default async function PublicFooter() {
  const t = await getTranslations("footer");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-20 hidden bg-[#2b0958] text-white md:block">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-5 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Image alt="CYNA" className="h-7 w-auto shrink-0" height={28} src="/brand/cyna-logo-full-white.svg" width={103} />
          <span className="text-[10px] font-medium leading-4 text-white/35">
            {t("copyright", { year: currentYear })} {t("websiteBy")}
          </span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          {footerLinks.map((link) => (
            <Link className="text-sm text-white/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" href={link.href} key={link.href}>
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
