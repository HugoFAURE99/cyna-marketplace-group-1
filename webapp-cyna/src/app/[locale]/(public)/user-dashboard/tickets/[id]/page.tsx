import { ArrowLeft, CalendarDays, Package } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/i18n/translations";
import { createServerClient } from "@/lib/supabase/server-client";
import { getCustomerTicket, ticketOrderLabel } from "@/lib/support/customer-tickets";

export const dynamic = "force-dynamic";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string; locale: Locale }> }) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("tickets");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();
  const ticket = await getCustomerTicket(user.id, id);
  if (!ticket) notFound();
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const order = ticketOrderLabel(ticket.commande, locale);

  return <div className="space-y-6">
    <Link className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-3 text-sm font-semibold text-purple-700 transition hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 active:bg-purple-100" href="/user-dashboard/tickets"><ArrowLeft aria-hidden="true" className="size-4" />{t("back")}</Link>
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 p-5 sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-purple-700">{t(`categories.${ticket.categorie}`)}</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{ticket.sujet}</h1></div><span className="inline-flex w-fit rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">{t(`statuses.${ticket.status}`)}</span></div><dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><div className="flex gap-2"><CalendarDays aria-hidden="true" className="mt-0.5 size-4 text-slate-400" /><div><dt className="text-slate-500">{t("created")}</dt><dd className="font-medium text-slate-800">{ticket.date_creation ? date.format(new Date(ticket.date_creation)) : t("unavailable")}</dd></div></div>{order && <div className="flex gap-2"><Package aria-hidden="true" className="mt-0.5 size-4 text-slate-400" /><div><dt className="text-slate-500">{t("relatedOrder")}</dt><dd><Link className="cursor-pointer font-medium text-purple-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700" href="/user-dashboard/purchases/orders">{order}</Link></dd></div></div>}</dl></header>
      <section aria-labelledby="ticket-conversation" className="p-5 sm:p-6"><h2 className="text-lg font-bold text-slate-950" id="ticket-conversation">{t("conversation")}</h2><ol className="mt-5 space-y-4">{ticket.ticket_support_message.map((message) => <li className={`flex ${message.sender === "customer" ? "justify-end" : "justify-start"}`} key={message.id_message}><article className={`max-w-[90%] rounded-xl px-4 py-3 sm:max-w-[75%] ${message.sender === "customer" ? "bg-purple-700 text-white" : "border border-slate-200 bg-slate-50 text-slate-800"}`}><div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs"><p className="font-bold">{message.sender === "customer" ? t("you") : t("support")}</p><time className={message.sender === "customer" ? "text-purple-100" : "text-slate-500"} dateTime={message.created_at}>{date.format(new Date(message.created_at))}</time></div><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{message.contenu}</p></article></li>)}</ol><p className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">{t("readOnlyNote")}</p></section>
    </article>
  </div>;
}
