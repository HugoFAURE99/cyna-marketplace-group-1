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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{translations.title}</h1>
        <PeriodSelect
          value={globalPeriod}
          onChange={handleGlobalChange}
          translations={translations}
        />
      </div>

      {isPending && (
        <div className="mb-4 text-sm text-muted-foreground">
          {translations.period}...
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart 1 - Sales histogram */}
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{salesTitle}</h2>
            <PeriodSelect
              value={chartPeriods.sales}
              onChange={(p) => handleChartPeriodChange("sales", p)}
              translations={translations}
            />
          </div>
          {salesData && salesData.salesByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData.salesByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#6366f1" name={translations.total} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-muted-foreground">
              {translations.noData}
            </p>
          )}
        </div>

        {/* Chart 2 - Stacked bar chart by category */}
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{stackedTitle}</h2>
            <PeriodSelect
              value={chartPeriods.stacked}
              onChange={(p) => handleChartPeriodChange("stacked", p)}
              translations={translations}
            />
          </div>
          {stackedData && stackedChartData.length > 0 && stackedCategoryNames.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stackedChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
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
          ) : (
            <p className="py-12 text-center text-muted-foreground">
              {translations.noData}
            </p>
          )}
        </div>
      </div>

      {/* Chart 3 - Pie chart full width */}
      <div className="mt-6 rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {translations.salesByCategory}
          </h2>
          <PeriodSelect
            value={chartPeriods.pie}
            onChange={(p) => handleChartPeriodChange("pie", p)}
            translations={translations}
          />
        </div>
        {pieData && pieData.categoryPieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData.categoryPieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                nameKey="name"
                label
              >
                {pieData.categoryPieData.map((_, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={COLORS[idx % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-12 text-center text-muted-foreground">
            {translations.noData}
          </p>
        )}
      </div>
    </div>
  );
}
