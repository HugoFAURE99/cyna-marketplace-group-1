import type { Event } from "@sentry/nextjs";
import { describe, expect, it } from "vitest";

import { scrubSentryEvent } from "@/lib/observability/sentry-privacy";

describe("scrubSentryEvent", () => {
  it("removes user data, request bodies, cookies, and private headers", () => {
    const event: Event = {
      extra: { operation: "checkout" },
      request: {
        cookies: { session: "secret" },
        data: { cardholder: "Client CYNA" },
        headers: {
          Authorization: "Bearer secret",
          Cookie: "session=secret",
          "Content-Type": "application/json",
          "X-Supabase-Auth": "secret",
        },
        method: "POST",
        url: "https://example.test/api/checkout",
      },
      user: {
        email: "client@example.test",
        id: "account-id",
        ip_address: "127.0.0.1",
      },
    };

    const scrubbed = scrubSentryEvent(event);

    expect(scrubbed.user).toBeUndefined();
    expect(scrubbed.request?.cookies).toBeUndefined();
    expect(scrubbed.request?.data).toBeUndefined();
    expect(scrubbed.request?.headers).toEqual({
      "Content-Type": "application/json",
    });
    expect(scrubbed.extra).toEqual({ operation: "checkout" });
  });

  it("handles events without an HTTP request", () => {
    expect(scrubSentryEvent({ message: "background failure" })).toEqual({
      message: "background failure",
      request: undefined,
      user: undefined,
    });
  });
});
