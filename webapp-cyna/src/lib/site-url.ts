import "server-only";

// Absolute base for links we build server-side (auth callbacks, Stripe
// redirect/return URLs). We keep only the URL origin (scheme + host + port)
// so a NEXT_PUBLIC_SITE_URL that was mis-configured with a trailing slash or a
// stray locale segment (e.g. ".../en") can't leak into the path and 404.
export function getSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) throw new Error("SITE_URL_NOT_CONFIGURED");
  try {
    return new URL(raw).origin;
  } catch {
    throw new Error("SITE_URL_INVALID");
  }
}
