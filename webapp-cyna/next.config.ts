import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
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

export default withNextIntl(nextConfig);
