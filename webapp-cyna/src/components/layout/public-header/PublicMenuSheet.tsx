"use client";

// Slide-in menu drawer (auth actions + info links) built on the shared Sheet.
// The Sheet gives slide animation, click-outside/Escape close, and focus trap.

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FileText,
  Info,
  LogIn,
  Mail,
  Menu,
  Scale,
  UserPlus,
  X,
} from "lucide-react";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const informationLinks = [
  {
    href: "/terms",
    icon: FileText,
    label: "Terms of Use",
  },
  {
    href: "/legal",
    icon: Scale,
    label: "Legal Notices",
  },
  {
    href: "/contact",
    icon: Mail,
    label: "Contact",
  },
  {
    href: "/about",
    icon: Info,
    label: "About CYNA",
  },
];

export default function PublicMenuSheet() {
  // Controlled so navigating a link can close the drawer.
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger
        aria-label="Open menu"
        className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-slate-950 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      >
        <Menu aria-hidden="true" className="size-6" />
      </SheetTrigger>

      <SheetContent
        className="w-[316px] gap-0 bg-white p-0 text-slate-700 data-[side=right]:w-[316px] sm:max-w-[316px]"
        showCloseButton={false}
        side="right"
      >
        <SheetTitle className="sr-only">Menu</SheetTitle>

        {/* Close button floats just outside the panel's top-left corner. */}
        <SheetClose
          aria-label="Close menu"
          className="absolute -left-12 top-4 inline-flex size-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-md transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <X aria-hidden="true" className="size-6" />
        </SheetClose>

        {/* Actions + navigation, flush to the top of the panel. */}
        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-6">
          <div className="space-y-2">
            <Link
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-purple-700 px-4 text-sm font-semibold text-white transition hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700"
              href="/login"
              onClick={closeMenu}
            >
              <LogIn aria-hidden="true" className="size-4" />
              Log In
            </Link>
            <Link
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-purple-700 bg-white px-4 text-sm font-semibold text-purple-700 transition hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700"
              href="/register"
              onClick={closeMenu}
            >
              <UserPlus aria-hidden="true" className="size-4" />
              Sign Up
            </Link>
          </div>

          <nav aria-label="Information" className="mt-7">
            <p className="mb-4 text-xs font-bold uppercase tracking-normal text-slate-400">
              Information
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
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Brand pinned to the bottom of the drawer. */}
        <div className="mt-auto border-t border-slate-100 px-6 py-5">
          <Link
            aria-label="CYNA home"
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
