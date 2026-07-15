import type { Event } from "@sentry/nextjs";

const PRIVATE_HEADERS = new Set([
  "authorization",
  "cookie",
  "proxy-authorization",
  "set-cookie",
  "x-supabase-auth",
]);

/**
 * Last-resort privacy boundary for every Sentry event emitted by CYNA.
 * Operational code should still avoid attaching customer data in the first place.
 */
export function scrubSentryEvent<T extends Event>(event: T): T {
  const request = event.request ? { ...event.request } : undefined;

  if (request) {
    request.cookies = undefined;
    request.data = undefined;

    if (request.headers) {
      request.headers = Object.fromEntries(
        Object.entries(request.headers).filter(
          ([name]) => !PRIVATE_HEADERS.has(name.toLowerCase()),
        ),
      );
    }
  }

  return {
    ...event,
    request,
    user: undefined,
  } as T;
}
