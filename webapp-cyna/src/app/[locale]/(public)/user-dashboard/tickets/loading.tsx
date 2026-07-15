import { getTranslations } from "next-intl/server";

export default async function TicketsLoading() {
  const t = await getTranslations("tickets");
  return <div aria-busy="true" aria-label={t("loading")} className="space-y-4"><div className="h-9 w-64 animate-pulse rounded bg-slate-200" /><div className="h-5 w-full max-w-xl animate-pulse rounded bg-slate-100" />{[1, 2, 3].map((item) => <div className="h-36 animate-pulse rounded-xl border border-slate-200 bg-white" key={item} />)}</div>;
}
