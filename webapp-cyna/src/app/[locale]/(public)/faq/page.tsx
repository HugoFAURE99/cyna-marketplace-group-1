import { ChevronDown, LogIn, Mail, MapPin, UserPlus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import SupportTicketForm from "@/components/support/SupportTicketForm";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/i18n/translations";
import { createServerClient } from "@/lib/supabase/server-client";
import { getUserOrderOptions } from "@/lib/support/orders";

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

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const orders = user ? await getUserOrderOptions(user.id, locale) : [];

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

      <section className="mt-12 rounded-xl border border-slate-200 bg-white p-6" id="contact">
        <h2 className="text-xl font-semibold text-slate-900">{t("contactTitle")}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">{t("contactIntro")}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <a className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 transition hover:border-purple-300" href="mailto:support.cyna@gmail.com">
            <Mail aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-purple-700" />
            <span><span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">{t("contactEmail")}</span><span className="mt-1 block text-sm font-medium text-slate-900">support.cyna@gmail.com</span></span>
          </a>
          <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
            <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-purple-700" />
            <span><span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">{t("projectLocation")}</span><span className="mt-1 block text-sm font-medium text-slate-900">Institut Limayrac<br />50 rue de Limayrac<br />31079 Toulouse Cedex 5</span></span>
          </div>
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500">{t("schoolDisclaimer")}</p>
      </section>

      <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-xl font-semibold text-slate-900">
          {tSupport("title")}
        </h2>
        {user ? (
          <>
            <p className="mt-1 mb-5 text-sm text-slate-600">
              {tSupport("subtitle")}
            </p>
            <SupportTicketForm defaultEmail={user.email ?? ""} orders={orders} />
          </>
        ) : (
          <>
            <p className="mt-1 mb-5 text-sm text-slate-600">
              {tSupport("loginRequiredBody")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-purple-700 px-5 text-sm font-semibold text-white transition hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700"
                href="/login"
              >
                <LogIn aria-hidden="true" className="size-4" />
                {tSupport("logIn")}
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-purple-700 bg-white px-5 text-sm font-semibold text-purple-700 transition hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700"
                href="/register"
              >
                <UserPlus aria-hidden="true" className="size-4" />
                {tSupport("createAccount")}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
