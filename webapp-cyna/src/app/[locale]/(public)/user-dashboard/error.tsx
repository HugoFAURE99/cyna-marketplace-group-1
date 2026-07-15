"use client";

import { useTranslations } from "next-intl";

export default function UserDashboardError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("user_dashboard");
  return <div className="mx-auto my-8 w-[calc(100%-2rem)] max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-6" role="alert"><h1 className="font-bold text-amber-950">{t("errorTitle")}</h1><p className="mt-2 text-sm text-amber-800">{t("errorBody")}</p><button className="mt-5 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-amber-900 px-4 text-sm font-semibold text-white transition hover:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-900 active:bg-amber-950" onClick={reset} type="button">{t("retry")}</button></div>;
}
