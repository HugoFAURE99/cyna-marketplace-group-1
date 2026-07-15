"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";

import { getCommerceReportAction } from "@/app/[locale]/(admin)/admin/_actions/sales.actions";
import type {
  CategoryAverageMetric,
  CommerceReportData,
} from "@/lib/admin/commerce-report-types";
import type { Locale } from "@/lib/i18n/translations";

type ChartKind = "average" | "category" | "revenue";
type ChartPeriod = "global" | "7d" | "5w";

type CategoryChartRow = {
  key: string;
  label: string;
  metrics: Record<string, CategoryAverageMetric>;
} & Record<string, number | string | Record<string, CategoryAverageMetric>>;

const DEFAULT_FILTERS: Record<ChartKind, ChartPeriod> = {
  average: "global",
  category: "global",
  revenue: "global",
};

export function SalesOverviewCharts({
  data: globalData,
  locale,
}: {
  data: CommerceReportData;
  locale: Locale;
}) {
  const t = useTranslations("admin.sales");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [reports, setReports] = useState<Record<ChartKind, CommerceReportData>>({
    average: globalData,
    category: globalData,
    revenue: globalData,
  });
  const [loading, setLoading] = useState<Record<ChartKind, boolean>>({
    average: false,
    category: false,
    revenue: false,
  });
  const [errors, setErrors] = useState<Record<ChartKind, string>>({
    average: "",
    category: "",
    revenue: "",
  });
  const requestIds = useRef<Record<ChartKind, number>>({
    average: 0,
    category: 0,
    revenue: 0,
  });
  const currency = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  });
  const compactCurrency = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const number = new Intl.NumberFormat(locale);
  const revenueData = reports.revenue;
  const averageData = reports.average;
  const categoryData = reports.category;
  const totalCategoryRevenue = categoryData.categories.reduce(
    (total, category) => total + category.revenue,
    0,
  );
  const chartRows: CategoryChartRow[] = averageData.categoryAverages.points.map((point) => {
    return {
      key: point.key,
      label: point.label,
      metrics: point.values,
      ...Object.fromEntries(
        averageData.categoryAverages.categories.map((category) => [
          category.key,
          point.values[category.key]?.averageOrderValue ?? 0,
        ]),
      ),
    };
  });
  const salesTitle =
    revenueData.range.granularity === "month"
      ? t("salesPerMonth")
      : revenueData.range.granularity === "week"
        ? t("salesPerWeek")
        : t("salesPerDay");
  const hasRevenue = revenueData.trend.some((point) => point.revenue > 0);
  const hasAverageSales = averageData.trend.some((point) => point.revenue > 0);

  async function changeChartPeriod(chart: ChartKind, period: ChartPeriod) {
    const requestId = requestIds.current[chart] + 1;
    requestIds.current[chart] = requestId;
    setFilters((current) => ({ ...current, [chart]: period }));
    setErrors((current) => ({ ...current, [chart]: "" }));

    if (period === "global") {
      setReports((current) => ({ ...current, [chart]: globalData }));
      setLoading((current) => ({ ...current, [chart]: false }));
      return;
    }

    setLoading((current) => ({ ...current, [chart]: true }));
    try {
      const result = await getCommerceReportAction({
        horizon: globalData.subscriptions.horizon,
        locale,
        preset: period,
      });
      if (requestIds.current[chart] !== requestId) return;
      if (!result.ok) {
        setErrors((current) => ({ ...current, [chart]: t("rangeError") }));
        return;
      }
      setReports((current) => ({ ...current, [chart]: result.data }));
    } catch {
      if (requestIds.current[chart] === requestId) {
        setErrors((current) => ({ ...current, [chart]: t("rangeError") }));
      }
    } finally {
      if (requestIds.current[chart] === requestId) {
        setLoading((current) => ({ ...current, [chart]: false }));
      }
    }
  }

  return (
    <section aria-labelledby="featured-sales-charts" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold" id="featured-sales-charts">
          {t("featuredCharts")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("subtitle", { from: globalData.range.from, to: globalData.range.to })}
        </p>
      </div>

      <div className="grid gap-4">
        <ChartCard
          controls={<ChartPeriodFilter chartTitle={salesTitle} loading={loading.revenue} onChange={(period) => changeChartPeriod("revenue", period)} value={filters.revenue} />}
          error={errors.revenue}
          period={t("subtitle", { from: revenueData.range.from, to: revenueData.range.to })}
          title={salesTitle}
        >
          {hasRevenue ? (
            <BarChart data={revenueData.trend} margin={{ bottom: 4, left: 2, right: 8, top: 8 }} responsive style={{ height: 340, width: "100%" }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" fontSize={11} interval={0} minTickGap={12} />
              <YAxis
                fontSize={11}
                tickFormatter={(value) => compactCurrency.format(Number(value))}
                width={62}
              />
              <Tooltip formatter={(value) => currency.format(Number(value))} />
              <Bar dataKey="revenue" fill="#8b5cf6" name={t("revenue")} />
            </BarChart>
          ) : (
            <EmptyState label={t("noData")} />
          )}
          <table className="sr-only">
            <caption>{salesTitle}</caption>
            <thead><tr><th>{t("period")}</th><th>{t("revenue")}</th></tr></thead>
            <tbody>
              {revenueData.trend.map((point) => (
                <tr key={point.key}><td>{point.label}</td><td>{currency.format(point.revenue)}</td></tr>
              ))}
            </tbody>
          </table>
        </ChartCard>

        <ChartCard
          controls={<ChartPeriodFilter chartTitle={t("avgCartByCategory")} loading={loading.average} onChange={(period) => changeChartPeriod("average", period)} value={filters.average} />}
          description={t("categoryAverageHelp")}
          error={errors.average}
          period={t("subtitle", { from: averageData.range.from, to: averageData.range.to })}
          title={t("avgCartByCategory")}
        >
          {averageData.categoryAverages.categories.length && hasAverageSales ? (
            <>
              <BarChart data={chartRows} margin={{ bottom: 4, left: 8, right: 8, top: 8 }} responsive style={{ height: 340, width: "100%" }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" fontSize={11} interval={0} minTickGap={12} />
                <YAxis
                  fontSize={11}
                  label={{ angle: -90, position: "insideLeft", value: t("averageCartAxis") }}
                  tickFormatter={(value) => compactCurrency.format(Number(value))}
                  width={72}
                />
                <Tooltip
                  content={(props) => (
                    <CategoryAverageTooltip {...props} currency={currency} number={number} />
                  )}
                />
                {averageData.categoryAverages.categories.map((category) => (
                  <Bar
                    dataKey={category.key}
                    fill={category.color}
                    key={category.key}
                    name={category.name}
                    stackId="category-average"
                  />
                ))}
              </BarChart>
              <CategoryLegend categories={averageData.categoryAverages.categories} />
            </>
          ) : (
            <EmptyState label={t("noData")} />
          )}
          <table className="sr-only">
            <caption>{t("avgCartByCategory")}</caption>
            <thead>
              <tr>
                <th>{t("period")}</th><th>{t("category")}</th><th>{t("averageCart")}</th>
                <th>{t("categoryRevenue")}</th><th>{t("orderVolume")}</th>
              </tr>
            </thead>
            <tbody>
              {averageData.categoryAverages.points.flatMap((point) =>
                averageData.categoryAverages.categories.map((category) => {
                  const metric = point.values[category.key];
                  return (
                    <tr key={`${point.key}-${category.key}`}>
                      <td>{point.label}</td><td>{category.name}</td>
                      <td>{currency.format(metric?.averageOrderValue ?? 0)}</td>
                      <td>{currency.format(metric?.revenue ?? 0)}</td>
                      <td>{number.format(metric?.orderCount ?? 0)}</td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        </ChartCard>

        <ChartCard
          controls={<ChartPeriodFilter chartTitle={t("salesByCategory")} loading={loading.category} onChange={(period) => changeChartPeriod("category", period)} value={filters.category} />}
          error={errors.category}
          period={t("subtitle", { from: categoryData.range.from, to: categoryData.range.to })}
          title={t("salesByCategory")}
        >
          {categoryData.categories.length && totalCategoryRevenue > 0 ? (
            <>
              <PieChart responsive style={{ height: 340, width: "100%" }}>
                <Pie
                  data={categoryData.categories}
                  dataKey="revenue"
                  innerRadius="42%"
                  nameKey="name"
                  outerRadius="78%"
                  paddingAngle={1}
                >
                  {categoryData.categories.map((category) => (
                    <Cell fill={category.color} key={category.key} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => {
                    const amount = Number(value);
                    const share = totalCategoryRevenue
                      ? (amount / totalCategoryRevenue) * 100
                      : 0;
                    return [`${currency.format(amount)} (${share.toFixed(1)} %)`, name];
                  }}
                />
              </PieChart>
              <CategoryLegend categories={categoryData.categories} />
            </>
          ) : (
            <EmptyState label={t("noData")} />
          )}
          <table className="sr-only">
            <caption>{t("salesByCategory")}</caption>
            <thead><tr><th>{t("category")}</th><th>{t("revenue")}</th><th>{t("share")}</th></tr></thead>
            <tbody>
              {categoryData.categories.map((category) => (
                <tr key={category.key}>
                  <td>{category.name}</td><td>{currency.format(category.revenue)}</td>
                  <td>{totalCategoryRevenue ? ((category.revenue / totalCategoryRevenue) * 100).toFixed(1) : "0"} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ChartCard>
      </div>
    </section>
  );
}

function ChartPeriodFilter({
  chartTitle,
  loading,
  onChange,
  value,
}: {
  chartTitle: string;
  loading: boolean;
  onChange: (period: ChartPeriod) => void;
  value: ChartPeriod;
}) {
  const t = useTranslations("admin.sales");
  return (
    <div className="flex items-center gap-2">
      {loading && <Loader2 aria-hidden="true" className="size-4 animate-spin text-primary" />}
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        <span className="sr-only">{chartTitle} - {t("chartPeriod")}</span>
        <select
          aria-label={`${chartTitle} - ${t("chartPeriod")}`}
          className="min-h-9 rounded-md border bg-background px-3 text-sm text-foreground"
          disabled={loading}
          onChange={(event) => onChange(event.target.value as ChartPeriod)}
          value={value}
        >
          <option value="global">{t("useGlobalPeriod")}</option>
          <option value="7d">{t("last7days")}</option>
          <option value="5w">{t("last5weeks")}</option>
        </select>
      </label>
    </div>
  );
}

function CategoryAverageTooltip({
  active,
  currency,
  label,
  number,
  payload,
}: TooltipContentProps & {
  currency: Intl.NumberFormat;
  number: Intl.NumberFormat;
}) {
  const t = useTranslations("admin.sales");
  if (!active || !payload.length) return null;
  const row = payload[0]?.payload as CategoryChartRow | undefined;

  return (
    <div className="max-w-72 rounded-lg border bg-background p-3 text-xs shadow-lg">
      <p className="mb-2 font-semibold">{label}</p>
      <div className="space-y-2">
        {payload.map((entry) => {
          const key = String(entry.dataKey);
          const metric = row?.metrics[key];
          if (!metric || metric.revenue <= 0) return null;
          return (
            <div className="border-t pt-2 first:border-0 first:pt-0" key={key}>
              <p className="font-semibold" style={{ color: entry.color }}>{entry.name}</p>
              <p>{t("averageCart")}: {currency.format(metric.averageOrderValue)}</p>
              <p>{t("categoryRevenue")}: {currency.format(metric.revenue)}</p>
              <p>{t("orderVolume")}: {number.format(metric.orderCount)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoryLegend({
  categories,
}: {
  categories: CommerceReportData["categories"];
}) {
  const t = useTranslations("admin.sales");
  return (
    <ul aria-label={t("category")} className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
      {categories.map((category) => (
        <li className="flex items-center gap-2 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-primary" key={category.key} tabIndex={0}>
          <span aria-hidden="true" className="size-3 shrink-0 rounded-sm" style={{ backgroundColor: category.color }} />
          <span>{category.name}</span>
        </li>
      ))}
    </ul>
  );
}

function ChartCard({
  children,
  controls,
  description,
  error,
  period,
  title,
}: {
  children: React.ReactNode;
  controls: React.ReactNode;
  description?: string;
  error: string;
  period: string;
  title: string;
}) {
  return (
    <article className="min-w-0 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{period}</p>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {controls}
      </header>
      {error && <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
      <div className="mt-3">{children}</div>
    </article>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="flex min-h-72 items-center justify-center text-sm text-muted-foreground">{label}</div>;
}
