import { routing } from "@/i18n/routing";

export type ManagedLink = {
  href: string;
  kind: "anchor" | "external" | "internal";
};

export type ManagedLinkOptionKind = "anchor" | "category" | "page" | "product";

export type ManagedLinkOption = {
  href: string;
  kind: ManagedLinkOptionKind;
  label: string;
};

const CONTROL_OR_WHITESPACE = /[\u0000-\u0020\u007f]/;
const ANCHOR = /^#[A-Za-z][A-Za-z0-9_:.-]*$/;
const URI_SCHEME = /^[A-Za-z][A-Za-z0-9+.-]*:/;
const INTERNAL_ORIGIN = "https://cyna.internal";
const LOCALE_PREFIX = new RegExp(
  `^/(?:${routing.locales.join("|")})(?=/|$)`,
);

function normalizeInternalPath(value: string): string | null {
  const candidate = value.startsWith("./") ? value.slice(2) : value;
  if (!candidate || candidate.startsWith("//") || candidate.startsWith("../")) {
    return null;
  }

  const withLeadingSlash = candidate.startsWith("/") ? candidate : `/${candidate}`;
  const rawPathname = withLeadingSlash.split(/[?#]/, 1)[0];

  try {
    for (const segment of rawPathname.split("/")) {
      const decoded = decodeURIComponent(segment);
      if (
        decoded === "." ||
        decoded === ".." ||
        decoded.includes("/") ||
        decoded.includes("\\")
      ) {
        return null;
      }
    }

    const url = new URL(withLeadingSlash, INTERNAL_ORIGIN);
    if (url.origin !== INTERNAL_ORIGIN) return null;
    const pathname = url.pathname.replace(LOCALE_PREFIX, "") || "/";
    return `${pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

/**
 * Accepts CMS-managed destinations while keeping local navigation inside CYNA.
 * Protocol-relative URLs, credentials, control characters and non-HTTP schemes
 * are deliberately rejected.
 */
export function parseManagedLink(value: string | null | undefined): ManagedLink | null {
  const href = value?.trim();
  if (!href || CONTROL_OR_WHITESPACE.test(href) || href.includes("\\")) {
    return null;
  }

  if (ANCHOR.test(href)) {
    return { href, kind: "anchor" };
  }

  if (URI_SCHEME.test(href)) {
    try {
      const url = new URL(href);
      if ((url.protocol === "http:" || url.protocol === "https:") && !url.username && !url.password) {
        return { href: url.toString(), kind: "external" };
      }
    } catch {
      return null;
    }
    return null;
  }

  const internalHref = normalizeInternalPath(href);
  return internalHref ? { href: internalHref, kind: "internal" } : null;
}

export function managedLinkOrFallback(
  value: string | null | undefined,
  fallback: string,
): ManagedLink {
  return parseManagedLink(value) ?? parseManagedLink(fallback) ?? {
    href: "/",
    kind: "internal",
  };
}
