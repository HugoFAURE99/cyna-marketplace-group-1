import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  experimental: {
    // Behind Netlify's proxy the forwarded host differs from the internal
    // host, so Next.js rejects Server Action POSTs unless the public origins
    // are allow-listed here.
    serverActions: {
      allowedOrigins: ["cyna-g1.netlify.app"],
    },
  },
  async redirects() {
    return [{
      source: "/:locale(en|fr)/contact",
      destination: "/:locale/faq#contact",
      permanent: true,
    }];
  },
  // The Git repo root is one level above the Next app; keep Turbopack's
  // package/CSS resolution rooted in this app directory.
  turbopack: {
    root: appDir,
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withSentryConfig(withNextIntl(nextConfig), {
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
});
