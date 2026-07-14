"use client";

import { useState, useTransition } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { getSalesData } from "@/app/[locale]/(admin)/admin/_actions/sales.actions";

type Period = "7days" | "5weeks";

type SalesData = {
  salesByDay: { label: string; total: number }[];
  salesByCategory: {
    label: string;
    categories: Record<string, number>;
  }[];
  categoryPieData: { name: string; value: number }[];
  categoryNames: string[];
};

type Translations = {
  title: string;
  last7days: string;
  last5weeks: string;
  salesPerDay: string;
  salesPerWeek: string;
  avgCartByCategory: string;
  salesByCategory: string;
  total: string;
  noData: string;
  period: string;
};

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

function PeriodSelect({
  value,
  onChange,
  translations,
}: {
  value: Period;
  onChange: (p: Period) => void;
  translations: Translations;
}) {
  return (
    <select
      className="rounded-md border bg-background px-3 py-1.5 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value as Period)}
    >
      <option value="7days">{translations.last7days}</option>
      <option value="5weeks">{translations.last5weeks}</option>
    </select>
  );
}

export function SalesDashboard({
  initialData,
  translations,
}: {
  initialData: SalesData;
  translations: Translations;
}) {
  const [globalPeriod, setGlobalPeriod] = useState<Period>("7days");
  const [chartPeriods, setChartPeriods] = useState<{
    sales: Period;
    stacked: Period;
    pie: Period;
  }>({ sales: "7days", stacked: "7days", pie: "7days" });

  const [dataCache, setDataCache] = useState<Record<Period, SalesData>>({
    "7days": initialData,
    "5weeks": undefined as unknown as SalesData,
  });

  const [isPending, startTransition] = useTransition();

  const fetchIfNeeded = async (period: Period): Promise<SalesData> => {
    if (dataCache[period]) return dataCache[period];
    const data = await getSalesData(period);
    setDataCache((prev) => ({ ...prev, [period]: data }));
    return data;
  };

  const handleGlobalChange = (period: Period) => {
    setGlobalPeriod(period);
    setChartPeriods({ sales: period, stacked: period, pie: period });
    startTransition(async () => {
      await fetchIfNeeded(period);
    });
  };

  const handleChartPeriodChange = (
    chart: "sales" | "stacked" | "pie",
    period: Period
  ) => {
    setChartPeriods((prev) => ({ ...prev, [chart]: period }));
    startTransition(async () => {
      await fetchIfNeeded(period);
    });
  };

  const salesData = dataCache[chartPeriods.sales];
  const stackedData = dataCache[chartPeriods.stacked];
  const pieData = dataCache[chartPeriods.pie];

  const salesTitle =
    chartPeriods.sales === "7days"
      ? translations.salesPerDay
      : translations.salesPerWeek;

  const stackedTitle =
    chartPeriods.stacked === "7days"
      ? translations.avgCartByCategory
      : translations.avgCartByCategory;

  // Transform stacked data for recharts
  const stackedChartData = stackedData
    ? stackedData.salesByCategory.map((item) => ({
        label: item.label,
        ...item.categories,
      }))
    : [];

  const stackedCategoryNames = stackedData?.categoryNames || [];

  const axisStyle = { fontSize: 12 };
  const tooltipStyle = {
    borderRadius: 8,
    border: "1px solid var(--border)",
    fontSize: 12,
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{translations.title}</h1>
        <div className="flex items-center gap-2">
          {isPending && (
            <span className="text-xs text-muted-foreground">
              {translations.period}…
            </span>
          )}
          <PeriodSelect
            value={globalPeriod}
            onChange={handleGlobalChange}
            translations={translations}
          />
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Chart 1 — Sales histogram */}
        <ChartCard
          title={salesTitle}
          period={chartPeriods.sales}
          onPeriodChange={(p) => handleChartPeriodChange("sales", p)}
          translations={translations}
          hasData={!!salesData && salesData.salesByDay.length > 0}
          noData={translations.noData}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={salesData?.salesByDay ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={axisStyle} stroke="var(--muted-foreground)" />
              <YAxis tick={axisStyle} stroke="var(--muted-foreground)" width={48} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
              <Bar
                dataKey="total"
                fill="var(--primary)"
                name={translations.total}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 2 — Stacked bar chart by category */}
        <ChartCard
          title={stackedTitle}
          period={chartPeriods.stacked}
          onPeriodChange={(p) => handleChartPeriodChange("stacked", p)}
          translations={translations}
          hasData={stackedChartData.length > 0 && stackedCategoryNames.length > 0}
          noData={translations.noData}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stackedChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={axisStyle} stroke="var(--muted-foreground)" />
              <YAxis tick={axisStyle} stroke="var(--muted-foreground)" width={48} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {stackedCategoryNames.map((catName, idx) => (
                <Bar
                  key={catName}
                  dataKey={catName}
                  stackId="a"
                  fill={COLORS[idx % COLORS.length]}
                  name={catName}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 3 — Pie chart, full width bottom row */}
        <ChartCard
          className="lg:col-span-2"
          title={translations.salesByCategory}
          period={chartPeriods.pie}
          onPeriodChange={(p) => handleChartPeriodChange("pie", p)}
          translations={translations}
          hasData={!!pieData && pieData.categoryPieData.length > 0}
          noData={translations.noData}
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData?.categoryPieData ?? []}
                cx="50%"
                cy="50%"
                innerRadius="45%"
                outerRadius="80%"
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {(pieData?.categoryPieData ?? []).map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                wrapperStyle={{ fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  period,
  onPeriodChange,
  translations,
  hasData,
  noData,
  children,
  className = "",
}: {
  title: string;
  period: Period;
  onPeriodChange: (p: Period) => void;
  translations: Translations;
  hasData: boolean;
  noData: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col rounded-xl border bg-card p-4 shadow-sm ${className}`}
    >
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <h2 className="truncate text-sm font-semibold">{title}</h2>
        <PeriodSelect
          value={period}
          onChange={onPeriodChange}
          translations={translations}
        />
      </div>
      {hasData ? (
        children
      ) : (
        <div className="flex h-[280px] items-center justify-center text-center text-sm text-muted-foreground">
          {noData}
        </div>
      )}
    </div>
  );
}
