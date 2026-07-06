// Shared shell for the static information pages (About, Contact, Legal, Terms)
// so they match the rest of the site: consistent container width, heading
// rhythm, and brand accents instead of ad-hoc inline widths/spacing.
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ContentPageProps = {
  title: string;
  eyebrow?: string;
  intro?: ReactNode;
  children: ReactNode;
  // "prose" for reading content, "wide" for denser legal/reference pages.
  width?: "prose" | "wide";
};

export default function ContentPage({
  title,
  eyebrow,
  intro,
  children,
  width = "prose",
}: ContentPageProps) {
  return (
    <main className="flex-1">
      <div
        className={cn(
          "mx-auto w-full px-4 py-12 sm:px-6 lg:px-8",
          width === "wide" ? "max-w-4xl" : "max-w-3xl",
        )}
      >
        <header className="border-b border-slate-200 pb-6">
          {eyebrow && (
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-700">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            {title}
          </h1>
          {intro && (
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              {intro}
            </p>
          )}
        </header>

        <div className="mt-8 space-y-10">{children}</div>
      </div>
    </main>
  );
}

// A titled section used inside ContentPage. Numbered legal sections pass `index`.
export function ContentSection({
  title,
  index,
  children,
}: {
  title: string;
  index?: number;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-950">
        {index !== undefined && (
          <span className="mr-2 text-purple-700">{index}.</span>
        )}
        {title}
      </h2>
      <div className="space-y-4 text-base leading-7 text-slate-700">
        {children}
      </div>
    </section>
  );
}
