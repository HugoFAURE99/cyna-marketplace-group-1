"use client";

import { FileText, Info, LayoutGrid, LifeBuoy, LogIn, LogOut, Menu, Scale, UserPlus, UserRound, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { logout } from "@/app/(auth)/_action/auth.action";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher/LanguageSwitcher";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";

const informationLinks = [
  { href: "/faq", icon: LifeBuoy, labelKey: "faq" },
  { href: "/terms", icon: FileText, labelKey: "termsOfUse" },
  { href: "/legal", icon: Scale, labelKey: "legalNotices" },
  { href: "/about", icon: Info, labelKey: "aboutCyna" },
] as const;

export default function PublicMenuSheet({ categories, isLoggedIn = false }: { categories: { id_categorie: number; cat_nom: string }[]; isLoggedIn?: boolean }) {
  const t = useTranslations("menu");
  const tHeader = useTranslations("header");
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return <Sheet onOpenChange={setOpen} open={open}>
    <SheetTrigger aria-label={t("openMenu")} className="inline-flex size-11 cursor-pointer items-center justify-center rounded-md text-slate-950 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"><Menu aria-hidden="true" className="size-6" /></SheetTrigger>
    <SheetContent className="w-[min(340px,calc(100vw-24px))] gap-0 bg-white p-0 text-slate-700 data-[side=right]:w-[min(340px,calc(100vw-24px))] sm:max-w-[340px]" showCloseButton={false} side="right">
      <SheetTitle className="sr-only">{t("menu")}</SheetTitle>
      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-5">
        <div className="grid grid-cols-[minmax(0,1fr)_44px] items-start gap-2">
          <div className="min-w-0 space-y-2">
            {isLoggedIn ? <>
              <Link className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-purple-700 px-3 text-sm font-semibold text-white hover:bg-purple-800" href="/user-dashboard/infos" onClick={close}><UserRound aria-hidden="true" className="size-4" />{t("myAccount")}</Link>
              <form action={logout}><button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-purple-200 px-3 text-sm font-semibold text-purple-700 hover:bg-purple-50" onClick={close} type="submit"><LogOut aria-hidden="true" className="size-4" />{t("logOut")}</button></form>
            </> : <>
              <Link className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-purple-700 px-3 text-sm font-semibold text-white hover:bg-purple-800" href="/login" onClick={close}><LogIn aria-hidden="true" className="size-4" />{t("logIn")}</Link>
              <Link className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-purple-700 px-3 text-sm font-semibold text-purple-700 hover:bg-purple-50" href="/register" onClick={close}><UserPlus aria-hidden="true" className="size-4" />{t("signUp")}</Link>
            </>}
          </div>
          <SheetClose aria-label={t("closeMenu")} className="inline-flex size-11 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700"><X aria-hidden="true" className="size-6" /></SheetClose>
        </div>

        <nav aria-label={tHeader("categories")} className="mt-7 md:hidden">
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400"><LayoutGrid aria-hidden="true" className="size-4" />{tHeader("categories")}</p>
          <ul className="space-y-1"><li><Link className="block min-h-11 rounded-md px-3 py-3 text-sm font-medium hover:bg-purple-50 hover:text-purple-700" href="/search" onClick={close}>{tHeader("allProducts")}</Link></li>{categories.map((category) => <li key={category.id_categorie}><Link className="block min-h-11 rounded-md px-3 py-3 text-sm hover:bg-purple-50 hover:text-purple-700" href={`/search?category=${category.id_categorie}`} onClick={close}>{category.cat_nom}</Link></li>)}</ul>
        </nav>

        <nav aria-label={t("information")} className="mt-7"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{t("information")}</p><ul className="space-y-1">{informationLinks.map((item) => <li key={item.href}><Link className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-purple-50 hover:text-purple-700" href={item.href} onClick={close}><item.icon aria-hidden="true" className="size-4" />{t(item.labelKey)}</Link></li>)}</ul></nav>
        <div className="mt-7 flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 md:hidden"><span className="text-sm font-medium">{t("language")}</span><LanguageSwitcher /></div>
      </div>
      <div className="border-t border-slate-100 px-5 py-4"><Link aria-label={tHeader("homeAriaLabel")} href="/" onClick={close}><Image alt="CYNA" className="h-auto w-[100px]" height={27} src="/brand/cyna-logo-v2-header.svg" width={100} /></Link></div>
    </SheetContent>
  </Sheet>;
}
