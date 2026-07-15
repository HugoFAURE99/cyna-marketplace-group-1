import { describe, expect, it } from "vitest";

import { isOpenAdminAccessStatus } from "@/lib/support/admin-access";

describe("admin-access request deduplication", () => {
  it.each(["open", "in_progress", "waiting_customer"] as const)("treats %s as an existing open request", (status) => {
    expect(isOpenAdminAccessStatus(status)).toBe(true);
  });

  it.each(["resolved", "closed"] as const)("allows a later request after %s", (status) => {
    expect(isOpenAdminAccessStatus(status)).toBe(false);
  });
});
