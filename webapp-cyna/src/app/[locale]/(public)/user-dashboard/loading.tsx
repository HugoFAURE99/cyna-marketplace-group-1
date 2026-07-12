import { getTranslations } from "next-intl/server";

export default async function UserDashboardLoading() {
  const t = await getTranslations("user_dashboard");
  return <div aria-busy="true" aria-label={t("loading")} className="mx-auto w-full max-w-7xl space-y-5 px-4 py-8"><span className="sr-only">{t("loading")}</span><div className="h-9 w-64 animate-pulse rounded bg-slate-200" /><div className="h-5 w-full max-w-xl animate-pulse rounded bg-slate-100" /><div className="h-52 animate-pulse rounded-xl border border-slate-200 bg-white" /></div>;
}
