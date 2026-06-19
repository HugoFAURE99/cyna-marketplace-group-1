// "Why CYNA" intro block; renders nothing when no content is configured.
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { HomeIntroContent } from "@/lib/home/public-home";

type HomeIntroProps = {
  content: HomeIntroContent | null;
};

export default async function HomeIntro({ content }: HomeIntroProps) {
  if (!content) {
    return null;
  }

  const t = await getTranslations("home");

  return (
    <section
      aria-labelledby={content.title ? "home-intro" : undefined}
      className="rounded-md border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      {content.eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-normal text-purple-700">
          {content.eyebrow}
        </p>
      )}
      {content.title && (
        <h2
          id="home-intro"
          className="mt-2 max-w-3xl text-2xl font-bold text-slate-950 sm:text-3xl"
        >
          {content.title}
        </h2>
      )}
      {content.body && (
        <p className="mt-4 max-w-5xl text-base leading-7 text-slate-700">
          {content.body}
        </p>
      )}
      {content.linkLabel && (
        <Link
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-purple-700 transition hover:text-purple-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700"
          href="/search"
        >
          {t("browseAllProducts")}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      )}
    </section>
  );
}
