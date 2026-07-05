import { ChevronDown } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import SupportTicketForm from "@/components/support/SupportTicketForm";
import type { Locale } from "@/lib/i18n/translations";

type FaqItem = { q: string; a: string };

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("faq");
  const tSupport = await getTranslations("support");
  const items = t.raw("items") as FaqItem[];

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12">
      <h1 className="text-3xl font-bold text-purple-800">{t("title")}</h1>
      <p className="mt-3 text-slate-600">{t("subtitle")}</p>

      <h2 className="mt-10 mb-4 text-xl font-semibold text-slate-900">
        {t("questionsTitle")}
      </h2>
      <div className="space-y-3">
        {items.map((item, index) => (
          <details
            key={index}
            className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition open:shadow-md [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-slate-900">
              {item.q}
              <ChevronDown
                aria-hidden="true"
                className="size-5 shrink-0 text-purple-600 transition group-open:rotate-180"
              />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {item.a}
            </p>
          </details>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-xl font-semibold text-slate-900">
          {tSupport("title")}
        </h2>
        <p className="mt-1 mb-5 text-sm text-slate-600">
          {tSupport("subtitle")}
        </p>
        <SupportTicketForm />
      </div>
    </div>
  );
}
