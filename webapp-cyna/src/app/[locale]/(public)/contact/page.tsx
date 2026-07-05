import { getTranslations, setRequestLocale } from "next-intl/server";
import { Mail, Phone, Smartphone } from "lucide-react";

import ContentPage from "@/components/layout/ContentPage";
import type { Locale } from "@/lib/i18n/translations";

const LANDLINE = "+33 1 99 00 34 56";
const MOBILE = "+33 6 99 00 78 90";
const EMAIL = "marketing@cyna-it.fr";

export default async function Contact({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  const rows = [
    {
      icon: Phone,
      label: t("landline"),
      value: LANDLINE,
      href: `tel:${LANDLINE.replace(/\s+/g, "")}`,
    },
    {
      icon: Smartphone,
      label: t("mobile"),
      value: MOBILE,
      href: `tel:${MOBILE.replace(/\s+/g, "")}`,
    },
    { icon: Mail, label: t("email"), value: EMAIL, href: `mailto:${EMAIL}` },
  ];

  return (
    <ContentPage title={t("title")}>
      <ul className="grid gap-4 sm:grid-cols-2">
        {rows.map((row) => (
          <li key={row.label}>
            <a
              className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-purple-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700"
              href={row.href}
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-700">
                <row.icon aria-hidden="true" className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {row.label}
                </span>
                <span className="block truncate text-base font-medium text-slate-900">
                  {row.value}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </ContentPage>
  );
}
