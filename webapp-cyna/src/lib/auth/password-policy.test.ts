import { describe, expect, it } from "vitest";

import {
  getAuthPasswordErrorKey,
  validatePassword,
} from "@/lib/auth/password-policy";

describe("password policy", () => {
  it("accepts passwords containing at least eight characters", () => {
    expect(validatePassword("abcdefgh")).toBeNull();
    expect(validatePassword("a-secure-password")).toBeNull();
  });

  it("rejects passwords shorter than eight characters", () => {
    expect(validatePassword("abcdefg")).toBe("errorTooShort");
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
