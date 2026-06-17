import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

// Detects the locale, redirects "/" to the prefixed default ("/fr"), and makes
// the active locale available to server components.
export default createMiddleware(routing);

export const config = {
  // Skip Next internals and anything with a file extension (static assets);
  // leave room for a future /api route group.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
