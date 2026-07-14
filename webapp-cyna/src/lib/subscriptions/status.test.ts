import { describe, expect, it } from "vitest";

import {
  isActiveSubscriptionStatus,
  isTerminalSubscriptionStatus,
  normalizeSubscriptionStatus,
} from "@/lib/subscriptions/status";

describe("subscription status normalization", () => {
  it.each([
    ["Actif", "active"],
    ["active", "active"],
    ["annulé", "canceled"],
    ["cancelled", "canceled"],
    ["expired", "canceled"],
    ["pending", "incomplete"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeSubscriptionStatus(input)).toBe(expected);
  });

  it("distinguishes renewable and terminal statuses", () => {
    expect(isActiveSubscriptionStatus("trialing")).toBe(true);
    expect(isActiveSubscriptionStatus("Actif")).toBe(true);
    expect(isTerminalSubscriptionStatus("canceled")).toBe(true);
    expect(isTerminalSubscriptionStatus("incomplete_expired")).toBe(true);
    expect(isTerminalSubscriptionStatus("paused")).toBe(false);
  });
});
