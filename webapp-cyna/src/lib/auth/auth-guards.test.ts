import { describe, expect, it } from "vitest";

import { isAdminDestination, sanitizeAuthNext, sanitizeMfaNext } from "@/lib/auth/mfa-return";
import { isActiveAdmin, isActiveClient } from "@/lib/auth/roles";

describe("admin access guards", () => {
  it("distinguishes active admins, active clients and inactive profiles", () => {
    expect(isActiveAdmin({ role: "admin", is_actif: true })).toBe(true);
    expect(isActiveAdmin({ role: "Admin", is_actif: true })).toBe(false);
    expect(isActiveAdmin({ role: "admin", is_actif: false })).toBe(false);
    expect(isActiveClient({ role: "client", is_actif: true })).toBe(true);
    expect(isActiveClient({ role: "client", is_actif: false })).toBe(false);
  });

  it("permits safe localized returns and rejects unsafe or looping destinations", () => {
    expect(sanitizeMfaNext("/fr/admin/products?tab=featured#top", "fr")).toBe("/fr/admin/products?tab=featured#top");
    expect(sanitizeMfaNext("/en/admin", "fr")).toBe("/fr/admin");
    expect(sanitizeMfaNext("/fr/user-dashboard", "fr")).toBe("/fr/user-dashboard");
    expect(sanitizeAuthNext("https://evil.example/fr/admin", "fr")).toBe("/fr");
    expect(sanitizeAuthNext("//evil.example/fr/admin", "fr")).toBe("/fr");
    expect(sanitizeAuthNext("/api/admin/users", "fr")).toBe("/fr");
    expect(sanitizeAuthNext("/API/admin/users", "fr")).toBe("/fr");
    expect(sanitizeAuthNext("/fr/mfa-verify?next=/fr/admin", "fr")).toBe("/fr");
    expect(sanitizeAuthNext("/fr/login/help", "fr")).toBe("/fr");
    expect(sanitizeAuthNext("/%2f%2fevil.example", "fr")).toBe("/fr");
    expect(sanitizeAuthNext("/fr/\\evil", "fr")).toBe("/fr");
    expect(isAdminDestination("/fr/admin/products", "fr")).toBe(true);
    expect(isAdminDestination("/fr/user-dashboard", "fr")).toBe(false);
  });
});
