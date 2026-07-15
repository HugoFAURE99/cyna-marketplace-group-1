import { MessageSquareText, Plus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/i18n/translations";
import { createServerClient } from "@/lib/supabase/server-client";
import { getCustomerTickets, ticketOrderLabel } from "@/lib/support/customer-tickets";

export const dynamic = "force-dynamic";

export default async function TicketsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("tickets");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const tickets = user ? await getCustomerTickets(user.id) : [];
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div><h1 className="text-3xl font-bold tracking-tight text-slate-950">{t("title")}</h1><p className="mt-2 max-w-2xl text-sm text-slate-600">{t("subtitle")}</p></div>
      <Link className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-purple-700 px-5 text-sm font-semibold text-white transition hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 active:bg-purple-900 sm:w-auto" href="/faq#contact"><Plus aria-hidden="true" className="size-4" />{t("newTicket")}</Link>
    </div>
    {tickets.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center"><MessageSquareText aria-hidden="true" className="mx-auto size-10 text-slate-400" /><h2 className="mt-4 font-semibold text-slate-950">{t("emptyTitle")}</h2><p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{t("emptyBody")}</p></div> : <ul className="space-y-3">{tickets.map((ticket) => {
      const order = ticketOrderLabel(ticket.commande, locale);
      return <li key={ticket.id_support}><Link className="group block cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-purple-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 active:bg-purple-50" href={`/user-dashboard/tickets/${ticket.id_support}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-purple-700">{t(`categories.${ticket.categorie}`)}</p><h2 className="mt-1 break-words text-lg font-bold text-slate-950 group-hover:text-purple-800">{ticket.sujet}</h2>{order && <p className="mt-2 text-sm text-slate-600">{order}</p>}</div><span className={`inline-flex w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusClass(ticket.status)}`}>{t(`statuses.${ticket.status}`)}</span></div><dl className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2"><div><dt className="text-xs font-medium text-slate-500">{t("created")}</dt><dd className="mt-1 font-medium text-slate-800">{ticket.date_creation ? date.format(new Date(ticket.date_creation)) : t("unavailable")}</dd></div><div><dt className="text-xs font-medium text-slate-500">{t("latestActivity")}</dt><dd className="mt-1 font-medium text-slate-800">{date.format(new Date(ticket.updated_at))}</dd></div></dl></Link></li>;
    })}</ul>}
  </div>;
}

function statusClass(status: string) {
  if (status === "resolved" || status === "closed") return "bg-slate-100 text-slate-700";
  if (status === "waiting_customer") return "bg-amber-100 text-amber-800";
  return "bg-purple-100 text-purple-800";
}
