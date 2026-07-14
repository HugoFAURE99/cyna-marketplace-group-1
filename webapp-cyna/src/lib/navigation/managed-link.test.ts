import { describe, expect, it } from "vitest";

import { managedLinkOrFallback, parseManagedLink } from "@/lib/navigation/managed-link";

describe("managed CMS links", () => {
  it.each([
    ["/search?category=2", "internal"],
    ["#top-products", "anchor"],
    ["https://example.com/path", "external"],
    ["http://localhost:3000/fr/admin", "external"],
  ])("accepts %s as %s", (href, kind) => {
    expect(parseManagedLink(href)?.kind).toBe(kind);
  });

  it.each(["javascript:alert(1)", "data:text/html,test", "//evil.example", "/bad\\path", "https://user:pass@example.com"])(
    "rejects unsafe destination %s",
    (href) => expect(parseManagedLink(href)).toBeNull(),
  );

  it("uses a safe localized fallback for empty or unsafe CMS values", () => {
    expect(managedLinkOrFallback("javascript:alert(1)", "/search")).toEqual({ href: "/search", kind: "internal" });
    expect(managedLinkOrFallback("", "#top-products")).toEqual({ href: "#top-products", kind: "anchor" });
  });
});
