"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  CircleUserRound,
  FileText,
  Info,
  LogIn,
  LogOut, // <-- 1. Nouvel icône ajouté
  Mail,
  Menu,
  Scale,
  UserPlus,
  X,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// 2. Import de ton action de déconnexion
import { logout } from "@/app/(auth)/_action/auth.action";

const informationLinks = [
  { href: "/terms", icon: FileText, labelKey: "termsOfUse" },
  { href: "/legal", icon: Scale, labelKey: "legalNotices" },
  { href: "/contact", icon: Mail, labelKey: "contact" },
  { href: "/about", icon: Info, labelKey: "aboutCyna" },
] as const;

// 3. On ajoute la propriété "isLoggedIn"
export default function PublicMenuSheet({
  isLoggedIn,
  userName,
}: {
  isLoggedIn?: boolean;
  userName?: string | null;
}) {
  const t = useTranslations("menu");
  const tHeader = useTranslations("header");
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger
        aria-label={t("openMenu")}
        className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-slate-950 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      >
        <Menu aria-hidden="true" className="size-6" />
      </SheetTrigger>

      <SheetContent
        className="w-[316px] gap-0 bg-white p-0 text-slate-700 data-[side=right]:w-[316px] sm:max-w-[316px]"
        showCloseButton={false}
        side="right"
      >
        <SheetTitle className="sr-only">{t("menu")}</SheetTitle>

        <SheetClose
          aria-label={t("closeMenu")}
          className="absolute -left-12 top-4 inline-flex size-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-md transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <X aria-hidden="true" className="size-6" />
        </SheetClose>

        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-6">
          {/* 4. LA LOGIQUE DES BOUTONS EST ICI */}
          <div className="space-y-2">
            {isLoggedIn ? (
              <>
                {/* Rappel de l'état connecté */}
                <div className="flex items-center gap-2 rounded-md bg-purple-50 px-3 py-2.5 text-sm text-slate-700">
                  <CircleUserRound
                    aria-hidden="true"
                    className="size-5 shrink-0 text-purple-700"
                  />
                  <span className="min-w-0 truncate">
                    {t("connectedAs")}{" "}
                    <span className="font-semibold text-slate-900">
                      {userName}
                    </span>
                  </span>
                </div>

                <form action={logout}>
                  <button
                    type="submit"
                    onClick={closeMenu}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-red-800 px-4 text-sm font-semibold text-white transition hover:bg-red-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800"
                  >
                    <LogOut aria-hidden="true" className="size-4" />
                    {t("logOut")}
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-purple-700 px-4 text-sm font-semibold text-white transition hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700"
                  href="/login"
                  onClick={closeMenu}
                >
                  <LogIn aria-hidden="true" className="size-4" />
                  {t("logIn")}
                </Link>
                <Link
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-purple-700 bg-white px-4 text-sm font-semibold text-purple-700 transition hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700"
                  href="/register"
                  onClick={closeMenu}
                >
                  <UserPlus aria-hidden="true" className="size-4" />
                  {t("signUp")}
                </Link>
              </>
            )}
          </div>

          <nav aria-label={t("information")} className="mt-7">
            <p className="mb-4 text-xs font-bold uppercase tracking-normal text-slate-400">
              {t("information")}
            </p>
            <ul className="space-y-1">
              {informationLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    className="flex items-center gap-3 rounded-md py-2 text-sm font-medium text-slate-600 transition hover:text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700"
                    href={item.href}
                    onClick={closeMenu}
                  >
                    <item.icon
                      aria-hidden="true"
                      className="size-4 shrink-0 text-slate-600"
                    />
                    {t(item.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-auto border-t border-slate-100 px-6 py-5">
          <Link
            aria-label={tHeader("homeAriaLabel")}
            className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700"
            href="/"
            onClick={closeMenu}
          >
            <Image
              alt="CYNA"
              className="h-auto w-[100px]"
              height={27}
              src="/brand/cyna-logo-v2-header.svg"
              width={100}
            />
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
