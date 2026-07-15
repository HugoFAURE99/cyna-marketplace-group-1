import { describe, expect, it } from "vitest";

import { isValidProfileName, normalizeProfileName } from "@/lib/account/profile-name";

describe("profile full name", () => {
  it("collapses surrounding and repeated whitespace without changing casing", () => {
    expect(normalizeProfileName("  Jean   de La   Fontaine  ")).toBe(
      "Jean de La Fontaine",
    );
  });

  it("enforces the 2 to 100 character normalized length", () => {
    expect(isValidProfileName("A")).toBe(false);
    expect(isValidProfileName("Li")).toBe(true);
    expect(isValidProfileName("x".repeat(100))).toBe(true);
    expect(isValidProfileName("x".repeat(101))).toBe(false);
  });
});
