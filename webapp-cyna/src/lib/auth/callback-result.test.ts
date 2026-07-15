import { describe, expect, it } from "vitest";

import { getAuthCallbackFailure } from "@/lib/auth/callback-result";

describe("auth callback result", () => {
  it("treats a failed signup session exchange as an already confirmed email", () => {
    const params = new URLSearchParams({ code: "confirmation-code", flow: "signup" });

    expect(getAuthCallbackFailure(params)).toEqual({
      key: "emailConfirmed",
      parameter: "message",
    });
  });

  it("guides users when a signup link has already been consumed or has expired", () => {
    const params = new URLSearchParams({ error_code: "otp_expired", flow: "signup" });

    expect(getAuthCallbackFailure(params)).toEqual({
      key: "confirmationLinkUsed",
      parameter: "message",
    });
  });

  it("recognises legacy signup callbacks without a next destination", () => {
    const params = new URLSearchParams({ locale: "fr" });

    expect(getAuthCallbackFailure(params).parameter).toBe("message");
  });

  it("keeps recovery callback failures as errors", () => {
    const params = new URLSearchParams({ flow: "recovery", next: "/update-password" });

    expect(getAuthCallbackFailure(params)).toEqual({
      key: "invalidLink",
      parameter: "error",
    });
  });
});
