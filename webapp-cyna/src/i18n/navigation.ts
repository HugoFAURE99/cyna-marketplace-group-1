import { createNavigation } from "next-intl/navigation";
import { routing } from "@/i18n/routing";

// Locale-aware navigation helpers: these keep the active locale prefix on every
// internal link/redirect, so use them instead of next/link & next/navigation.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
