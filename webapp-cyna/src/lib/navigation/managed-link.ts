export type ManagedLink = {
  href: string;
  kind: "anchor" | "external" | "internal";
};

const CONTROL_OR_WHITESPACE = /[\u0000-\u0020\u007f]/;
const ANCHOR = /^#[A-Za-z][A-Za-z0-9_:.-]*$/;

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

  if (href.startsWith("/") && !href.startsWith("//")) {
    return { href, kind: "internal" };
  }

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

export function managedLinkOrFallback(
  value: string | null | undefined,
  fallback: string,
): ManagedLink {
  return parseManagedLink(value) ?? parseManagedLink(fallback) ?? {
    href: "/",
    kind: "internal",
  };
}
