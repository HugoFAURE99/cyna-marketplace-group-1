import { describe, expect, it } from "vitest";

import {
  getAuthPasswordErrorKey,
  validatePassword,
} from "@/lib/auth/password-policy";

describe("password policy", () => {
  it("accepts passwords meeting the complexity policy", () => {
    expect(validatePassword("Abcdefg1!")).toBeNull();
    expect(validatePassword("Str0ng-Pass!")).toBeNull();
  });

  it("rejects passwords shorter than eight characters", () => {
    expect(validatePassword("Ab1!def")).toBe("errorTooShort");
  });

  it("rejects passwords missing a required character class", () => {
    // Length is fine (8+) but no uppercase / number / special character.
    expect(validatePassword("abcdefgh")).toBe("errorComplexity");
    expect(validatePassword("a-secure-password")).toBe("errorComplexity");
  });

  it.each([
    ["length", "errorTooShort"],
    ["characters", "errorComplexity"],
    ["pwned", "errorCompromised"],
  ] as const)("maps the Supabase %s reason to %s", (reason, expected) => {
    expect(getAuthPasswordErrorKey({ code: "weak_password", reasons: [reason] })).toBe(expected);
  });

  it("uses a generic security-policy error when Supabase omits the reason", () => {
    expect(getAuthPasswordErrorKey({ code: "weak_password" })).toBe("errorWeakPassword");
  });

  it("ignores unrelated authentication errors", () => {
    expect(getAuthPasswordErrorKey({ code: "email_exists" })).toBeNull();
  });
});
