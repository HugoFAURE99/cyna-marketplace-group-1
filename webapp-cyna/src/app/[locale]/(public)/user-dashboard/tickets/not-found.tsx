import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export default async function TicketNotFound() {
  const t = await getTranslations("tickets");
  return <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><h1 className="text-xl font-bold text-slate-950">{t("notFoundTitle")}</h1><p className="mt-2 text-sm text-slate-600">{t("notFoundBody")}</p><Link className="mt-5 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-purple-700 px-4 text-sm font-semibold text-white hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700" href="/user-dashboard/tickets">{t("back")}</Link></div>;
}
