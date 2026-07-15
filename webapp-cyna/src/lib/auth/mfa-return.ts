import type { Locale } from "@/lib/i18n/translations";

const AUTH_LOOP_PATHS = new Set(["/login", "/register", "/reset-password", "/mfa-verify"]);

export function localizedHomePath(locale: Locale): string {
  return `/${locale}`;
}

export function adminHomePath(locale: Locale): string {
  return `/${locale}/admin`;
}

export function sanitizeAuthNext(
  value: string | null | undefined,
  locale: Locale,
  fallback = localizedHomePath(locale),
): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value) || /%(?:00|0a|0d|2f|5c)/i.test(value)) return fallback;
  try {
    const url = new URL(value, "https://cyna.invalid");
    if (url.origin !== "https://cyna.invalid") return fallback;
    let pathname = url.pathname.replace(/^\/(fr|en)(?=\/|$)/, "");
    if (!pathname || pathname === "/") pathname = "";
    const normalizedPathname = pathname.toLocaleLowerCase("en-US");
    const isAuthLoop = [...AUTH_LOOP_PATHS].some(
      (authPath) => normalizedPathname === authPath || normalizedPathname.startsWith(`${authPath}/`),
    );
    if (normalizedPathname.startsWith("/api") || normalizedPathname.startsWith("/_next") || isAuthLoop) return fallback;
    return `/${locale}${pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function sanitizeMfaNext(value: string | null | undefined, locale: Locale): string {
  return sanitizeAuthNext(value, locale);
}

export function isAdminDestination(value: string, locale: Locale): boolean {
  const pathname = new URL(value, "https://cyna.invalid").pathname;
  const root = adminHomePath(locale);
  return pathname === root || pathname.startsWith(`${root}/`);
}
