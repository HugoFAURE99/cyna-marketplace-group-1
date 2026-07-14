"use client";

import { useState, useTransition } from "react";
import { ArrowDownRight, ArrowUpRight, Download, Loader2, Mail, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { getCommerceReportAction } from "@/app/[locale]/(admin)/admin/_actions/sales.actions";
import type { CommerceReportData, ReportPreset, SubscriptionDueItem, SubscriptionHorizon } from "@/lib/admin/commerce-report-types";
import type { Locale } from "@/lib/i18n/translations";

const COLORS = ["#7e22ce", "#2563eb", "#059669", "#d97706", "#dc2626", "#64748b"];
type SalesTab = "orders" | "subscriptions";

export function SalesDashboard({ initialData, initialTab = "orders", locale }: { initialData: CommerceReportData; initialTab?: SalesTab; locale: Locale }) {
  const t = useTranslations("admin.sales");
  const [data, setData] = useState(initialData);
  const [tab, setTab] = useState<SalesTab>(initialTab);
  const [preset, setPreset] = useState<ReportPreset>(initialData.range.preset);
  const [horizon, setHorizon] = useState<SubscriptionHorizon>(initialData.subscriptions.horizon);
  const [from, setFrom] = useState(initialData.range.from);
  const [to, setTo] = useState(initialData.range.to);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function updateUrl(nextTab: SalesTab, nextHorizon = horizon) {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", nextTab);
    url.searchParams.set("horizon", String(nextHorizon));
    window.history.replaceState(null, "", url);
  }

  function load(nextPreset: ReportPreset, customFrom = from, customTo = to, nextHorizon = horizon) {
    setPreset(nextPreset);
    setHorizon(nextHorizon);
    setError("");
    startTransition(async () => {
      try {
        const result = await getCommerceReportAction({
          preset: nextPreset,
          from: nextPreset === "custom" ? customFrom : undefined,
          to: nextPreset === "custom" ? customTo : undefined,
          locale,
          horizon: nextHorizon,
        });
        setData(result);
        setFrom(result.range.from);
        setTo(result.range.to);
        updateUrl(tab, nextHorizon);
      } catch {
        setError(t("rangeError"));
      }
    });
  }

  function changeTab(nextTab: SalesTab) {
    setTab(nextTab);
    updateUrl(nextTab);
  }

  const reportHref = `/api/admin/sales/report?locale=${locale}&preset=${preset}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&horizon=${horizon}`;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("title")}</h1><p className="mt-1 text-sm text-muted-foreground">{t("subtitle", { from: data.range.from, to: data.range.to })}</p></div>
        <div className="flex flex-wrap items-end gap-2 rounded-xl border bg-card p-3 shadow-sm">
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">{t("period")}<select className="min-h-10 rounded-md border bg-background px-3 text-sm text-foreground" onChange={(event) => load(event.target.value as ReportPreset)} value={preset}><option value="7d">{t("last7days")}</option><option value="30d">{t("last30days")}</option><option value="90d">{t("last90days")}</option><option value="ytd">{t("yearToDate")}</option><option value="custom">{t("custom")}</option></select></label>
          {preset === "custom" && <><label className="grid gap-1 text-xs font-medium text-muted-foreground">{t("from")}<input className="min-h-10 rounded-md border bg-background px-3 text-sm" max={to} onChange={(event) => setFrom(event.target.value)} type="date" value={from} /></label><label className="grid gap-1 text-xs font-medium text-muted-foreground">{t("to")}<input className="min-h-10 rounded-md border bg-background px-3 text-sm" min={from} onChange={(event) => setTo(event.target.value)} type="date" value={to} /></label><button className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50" disabled={isPending || !from || !to} onClick={() => load("custom", from, to)} type="button">{t("apply")}</button></>}
          <a className="inline-flex min-h-10 items-center gap-2 rounded-md border bg-background px-4 text-sm font-semibold transition hover:bg-accent" href={reportHref}><Download aria-hidden="true" className="size-4" /> {t("exportPdf")}</a>
        </div>
      </header>

      <nav aria-label={t("analyticsViews")} className="flex gap-1 rounded-xl border bg-card p-1 shadow-sm">
        {(["orders", "subscriptions"] as const).map((item) => <button aria-current={tab === item ? "page" : undefined} className={`min-h-10 flex-1 rounded-lg px-4 text-sm font-semibold transition sm:flex-none ${tab === item ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`} key={item} onClick={() => changeTab(item)} type="button">{t(`tabs.${item}`)}</button>)}
      </nav>

      {(isPending || error) && <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${error ? "border-destructive/30 bg-destructive/5 text-destructive" : "bg-card text-muted-foreground"}`}>{isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}{error || t("loading")}</div>}

      {tab === "orders" ? <OrderAnalytics data={data} locale={locale} /> : (
        <SubscriptionAnalytics data={data} horizon={horizon} locale={locale} onHorizonChange={(value) => load(preset, from, to, value)} />
      )}
    </div>
  );
}

function OrderAnalytics({ data, locale }: { data: CommerceReportData; locale: Locale }) {
  const t = useTranslations("admin.sales");
  const currency = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" });
  const number = new Intl.NumberFormat(locale);
  const kpis = [["grossRevenue", t("grossRevenue"), currency.format(data.current.grossRevenue)], ["orderCount", t("orderCount"), number.format(data.current.orderCount)], ["averageOrderValue", t("averageOrderValue"), currency.format(data.current.averageOrderValue)], ["uniqueCustomers", t("uniqueCustomers"), number.format(data.current.uniqueCustomers)]] as const;
  return <>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label={t("kpis")}>{kpis.map(([key, label, value]) => <KpiCard change={data.current.changes[key]} key={key} label={label} value={value} versus={t("versusPrevious")} />)}</section>
    <section className="grid gap-4 xl:grid-cols-3"><ChartCard className="xl:col-span-2" title={t("trendTitle")}><ResponsiveContainer height={320} width="100%"><ComposedChart data={data.trend} margin={{ left: 0, right: 10, top: 10 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" fontSize={11} minTickGap={20} /><YAxis fontSize={11} tickFormatter={(value) => `${value}€`} yAxisId="revenue" /><YAxis allowDecimals={false} fontSize={11} orientation="right" yAxisId="orders" /><Tooltip formatter={(value, name) => name === t("revenue") ? currency.format(Number(value)) : number.format(Number(value))} /><Legend /><Bar dataKey="revenue" fill="#7e22ce" name={t("revenue")} radius={[4, 4, 0, 0]} yAxisId="revenue" /><Line dataKey="orders" dot={false} name={t("orders")} stroke="#2563eb" strokeWidth={2} yAxisId="orders" /></ComposedChart></ResponsiveContainer></ChartCard><ChartCard title={t("categoryDistribution")}>{data.categories.length ? <ResponsiveContainer height={320} width="100%"><PieChart><Pie data={data.categories.slice(0, 8)} dataKey="revenue" innerRadius="48%" nameKey="name" outerRadius="78%">{data.categories.slice(0, 8).map((item, index) => <Cell fill={COLORS[index % COLORS.length]} key={item.name} />)}</Pie><Tooltip formatter={(value) => currency.format(Number(value))} /><Legend /></PieChart></ResponsiveContainer> : <EmptyState label={t("noData")} />}</ChartCard><ChartCard className="xl:col-span-2" title={t("topProducts")}>{data.topProducts.length ? <ResponsiveContainer height={320} width="100%"><BarChart data={data.topProducts.slice(0, 8)} layout="vertical" margin={{ left: 10, right: 20 }}><CartesianGrid horizontal={false} strokeDasharray="3 3" /><XAxis fontSize={11} tickFormatter={(value) => `${value}€`} type="number" /><YAxis dataKey="name" fontSize={11} type="category" width={130} /><Tooltip formatter={(value) => currency.format(Number(value))} /><Bar dataKey="revenue" fill="#059669" name={t("revenue")} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer> : <EmptyState label={t("noData")} />}</ChartCard><ChartCard title={t("billingMix")}><div className="space-y-3 py-2">{data.billingMix.length ? data.billingMix.map((item, index) => <div className="rounded-lg border p-3" key={item.plan}><div className="flex items-center justify-between gap-3"><span className="font-semibold capitalize"><span className="mr-2 inline-block size-2 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />{item.plan}</span><span className="text-sm font-semibold">{currency.format(item.revenue)}</span></div><p className="mt-1 text-xs text-muted-foreground">{t("units", { count: item.quantity })}</p></div>) : <EmptyState label={t("noData")} />}</div></ChartCard></section>
    <section className="grid gap-4 xl:grid-cols-2"><BreakdownTable currency={currency} items={data.topProducts} title={t("productRanking")} type="product" /><BreakdownTable currency={currency} items={data.categories} title={t("categoryRanking")} type="category" /></section>
  </>;
}

function SubscriptionAnalytics({ data, horizon, locale, onHorizonChange }: { data: CommerceReportData; horizon: SubscriptionHorizon; locale: Locale; onHorizonChange: (value: SubscriptionHorizon) => void }) {
  const t = useTranslations("admin.sales.subscriptions");
  const currency = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" });
  const number = new Intl.NumberFormat(locale);
  const health = data.subscriptions;
  return <div className="space-y-6">
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-semibold">{t("title")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("window", { from: health.asOf, to: health.to })}</p></div><label className="grid gap-1 text-xs font-medium text-muted-foreground">{t("horizon")}<select className="min-h-10 rounded-md border bg-background px-3 text-sm" onChange={(event) => onHorizonChange(Number(event.target.value) as SubscriptionHorizon)} value={horizon}>{([7, 30, 60, 90] as const).map((days) => <option key={days} value={days}>{t("days", { count: days })}</option>)}</select></label></div>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6"><KpiCard label={t("active")} value={number.format(health.active)} /><KpiCard label={t("activeSeats")} value={number.format(health.activeSeats)} /><KpiCard label={t("renewals")} value={number.format(health.upcomingRenewalCount)} /><KpiCard label={t("renewalValue")} value={currency.format(health.upcomingRenewalValue)} /><KpiCard label={t("endings")} value={number.format(health.scheduledEndingCount)} /><KpiCard label={t("endingValue")} value={currency.format(health.scheduledEndingValue)} /></section>
    <section className="grid gap-4 xl:grid-cols-2"><DueTable items={health.upcomingRenewals} locale={locale} title={t("renewalTable")} /><DueTable items={health.scheduledEndings} locale={locale} title={t("endingTable")} /></section>
    <section className="grid gap-4 lg:grid-cols-3"><HealthBreakdown items={health.productBreakdown.map((item) => ({ label: item.label, count: item.count, value: item.value }))} title={t("products")} currency={currency} /><HealthBreakdown items={health.billingBreakdown} title={t("billing")} currency={currency} /><article className="rounded-xl border bg-card p-4 shadow-sm"><h3 className="font-semibold">{t("statuses")}</h3><div className="mt-4 space-y-2">{health.statusBreakdown.length ? health.statusBreakdown.map((item) => <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm" key={item.label}><span className="capitalize">{item.label}</span><strong>{number.format(item.count)}</strong></div>) : <p className="text-sm text-muted-foreground">{t("empty")}</p>}</div></article></section>
  </div>;
}

function DueTable({ items, locale, title }: { items: SubscriptionDueItem[]; locale: Locale; title: string }) {
  const t = useTranslations("admin.sales.subscriptions");
  const currency = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" });
  return <article className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm"><div className="border-b px-4 py-3"><h3 className="font-semibold">{title}</h3></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-muted/50 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3">{t("customer")}</th><th className="px-4 py-3">{t("product")}</th><th className="px-4 py-3">{t("plan")}</th><th className="px-4 py-3 text-right">{t("seats")}</th><th className="px-4 py-3 text-right">{t("value")}</th><th className="px-4 py-3">{t("date")}</th><th className="px-4 py-3 text-right">{t("remaining")}</th></tr></thead><tbody>{items.length ? items.map((item) => <tr className="border-t" key={item.id}><td className="px-4 py-3"><p className="font-medium">{item.customerName || t("unknownCustomer")}</p>{item.contactEmail && <a className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline" href={`mailto:${item.contactEmail}`}><Mail className="size-3" />{item.contactEmail}</a>}</td><td className="px-4 py-3"><a className="font-medium hover:underline" href={`/${locale}/admin/subscriptions?detail=${item.id}`}>{item.productName}</a></td><td className="px-4 py-3 capitalize">{item.billingPlan}</td><td className="px-4 py-3 text-right">{item.seats}</td><td className="px-4 py-3 text-right font-semibold">{currency.format(item.value)}</td><td className="px-4 py-3">{new Intl.DateTimeFormat(locale).format(new Date(`${item.dueDate}T12:00:00Z`))}</td><td className="px-4 py-3 text-right">{t("daysRemaining", { count: item.daysRemaining })}</td></tr>) : <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={7}>{t("empty")}</td></tr>}</tbody></table></div></article>;
}

function HealthBreakdown({ currency, items, title }: { currency: Intl.NumberFormat; items: { count: number; label: string; value: number }[]; title: string }) {
  const t = useTranslations("admin.sales.subscriptions");
  return <article className="rounded-xl border bg-card p-4 shadow-sm"><h3 className="font-semibold">{title}</h3><div className="mt-4 space-y-2">{items.length ? items.slice(0, 8).map((item) => <div className="rounded-md border p-3" key={item.label}><div className="flex justify-between gap-3"><span className="font-medium">{item.label}</span><strong>{currency.format(item.value)}</strong></div><p className="mt-1 text-xs text-muted-foreground">{t("subscriptionsCount", { count: item.count })}</p></div>) : <p className="text-sm text-muted-foreground">{t("empty")}</p>}</div></article>;
}

function KpiCard({ change, label, value, versus }: { change?: number | null; label: string; value: string; versus?: string }) { const positive = change !== null && change !== undefined && change > 0; const negative = change !== null && change !== undefined && change < 0; const Icon = positive ? ArrowUpRight : negative ? ArrowDownRight : Minus; return <article className="rounded-xl border bg-card p-4 shadow-sm"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>{change !== undefined && <p className={`mt-2 flex items-center gap-1 text-xs font-semibold ${positive ? "text-emerald-700" : negative ? "text-red-700" : "text-muted-foreground"}`} title={versus}><Icon aria-hidden="true" className="size-3.5" />{change === null ? "—" : `${change > 0 ? "+" : ""}${change}%`}</p>}</article>; }
function ChartCard({ children, className = "", title }: { children: React.ReactNode; className?: string; title: string }) { return <article className={`min-w-0 rounded-xl border bg-card p-4 shadow-sm ${className}`}><h2 className="mb-4 font-semibold">{title}</h2>{children}</article>; }
function EmptyState({ label }: { label: string }) { return <div className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">{label}</div>; }
function BreakdownTable({ currency, items, title, type }: { currency: Intl.NumberFormat; items: CommerceReportData["topProducts"] | CommerceReportData["categories"]; title: string; type: "category" | "product" }) { const t = useTranslations("admin.sales"); return <article className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm"><div className="border-b px-4 py-3"><h2 className="font-semibold">{title}</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm"><thead className="bg-muted/50 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3">#</th><th className="px-4 py-3">{type === "product" ? t("product") : t("category")}</th>{type === "product" && <th className="px-4 py-3 text-right">{t("orders")}</th>}<th className="px-4 py-3 text-right">{t("quantity")}</th><th className="px-4 py-3 text-right">{t("revenue")}</th></tr></thead><tbody>{items.length ? items.map((item, index) => <tr className="border-t" key={`${item.id}-${item.name}`}><td className="px-4 py-3 text-muted-foreground">{index + 1}</td><td className="px-4 py-3 font-medium">{item.name}</td>{type === "product" && <td className="px-4 py-3 text-right">{"orders" in item ? item.orders : 0}</td>}<td className="px-4 py-3 text-right">{item.quantity}</td><td className="px-4 py-3 text-right font-semibold">{currency.format(item.revenue)}</td></tr>) : <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>{t("noData")}</td></tr>}</tbody></table></div></article>; }
