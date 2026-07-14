import { describe, expect, it } from "vitest";

import { managedLinkOrFallback, parseManagedLink } from "@/lib/navigation/managed-link";

describe("managed CMS links", () => {
  it.each([
    ["/search?category=2", "internal"],
    ["search?category=2", "internal"],
    ["./products/12", "internal"],
    ["#top-products", "anchor"],
    ["https://example.com/path", "external"],
    ["http://localhost:3000/fr/admin", "external"],
  ])("accepts %s as %s", (href, kind) => {
    expect(parseManagedLink(href)?.kind).toBe(kind);
  });

  it.each(["javascript:alert(1)", "data:text/html,test", "//evil.example", "../admin", "/a/../admin", "/%2e%2e/admin", "/bad\\path", "https://user:pass@example.com"])(
    "rejects unsafe destination %s",
    (href) => expect(parseManagedLink(href)).toBeNull(),
  );

  it.each([
    ["products/12", "/products/12"],
    ["./products/12", "/products/12"],
    ["/products/12", "/products/12"],
    ["/fr/products/12", "/products/12"],
    ["en/categories/4", "/categories/4"],
    ["/fr?source=cta", "/?source=cta"],
    ["search?category=2#results", "/search?category=2#results"],
  ])("normalizes %s to %s", (value, expected) => {
    expect(parseManagedLink(value)).toEqual({ href: expected, kind: "internal" });
  });

  it("uses a safe localized fallback for empty or unsafe CMS values", () => {
    expect(managedLinkOrFallback("javascript:alert(1)", "/search")).toEqual({ href: "/search", kind: "internal" });
    expect(managedLinkOrFallback("", "#top-products")).toEqual({ href: "#top-products", kind: "anchor" });
  });
});
