import type {
  BillingBreakdown,
  CategoryBreakdown,
  CommerceKpis,
  CommerceReportData,
  CommerceTrendPoint,
  ProductBreakdown,
  ReportRange,
  SubscriptionHealthData,
} from "@/lib/admin/commerce-report-types";
import { enumerateReportDays, reportDateKey } from "@/lib/admin/report-range";
import type { Locale } from "@/lib/i18n/translations";
import { isPaidOrderStatus } from "@/lib/orders/status";

export type CommerceOrderLine = {
  billingPlan: string;
  categoryId: number | null;
  categoryName: string;
  productId: number;
  productName: string;
  quantity: number;
  subtotal: number;
};

export type CommerceOrder = {
  customerId: string | null;
  date: string;
  guestEmail: string | null;
  id: number;
  lines: CommerceOrderLine[];
  status: string;
  total: number;
};

export function isCompletedOrderStatus(value: string): boolean {
  return isPaidOrderStatus(value);
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function summarize(orders: CommerceOrder[]): CommerceKpis {
  const customers = new Set<string>();
  let grossRevenue = 0;

  for (const order of orders) {
    grossRevenue += Number(order.total) || 0;
    const customer = order.customerId
      ? `account:${order.customerId}`
      : order.guestEmail?.trim().toLocaleLowerCase()
        ? `guest:${order.guestEmail.trim().toLocaleLowerCase()}`
        : null;
    if (customer) customers.add(customer);
  }

  return {
    grossRevenue: roundCurrency(grossRevenue),
    orderCount: orders.length,
    averageOrderValue: orders.length ? roundCurrency(grossRevenue / orders.length) : 0,
    uniqueCustomers: customers.size,
  };
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 10_000) / 100;
}

function dateLabel(key: string, locale: Locale, style: "day" | "month" | "week"): string {
  const date = new Date(`${key}T12:00:00Z`);
  if (style === "month") {
    return new Intl.DateTimeFormat(locale, { month: "short", year: "numeric" }).format(date);
  }
  const value = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(date);
  return style === "week" ? `${locale === "fr" ? "Sem." : "Wk."} ${value}` : value;
}

function createTrend(
  orders: CommerceOrder[],
  range: ReportRange,
  locale: Locale,
): CommerceTrendPoint[] {
  const days = enumerateReportDays(range.from, range.to);
  const style = days.length <= 31 ? "day" : days.length <= 120 ? "week" : "month";
  const bucketByDay = new Map<string, string>();
  const buckets = new Map<string, CommerceTrendPoint>();

  days.forEach((day, index) => {
    const key =
      style === "day"
        ? day
        : style === "week"
          ? days[index - (index % 7)]
          : day.slice(0, 7) + "-01";
    bucketByDay.set(day, key);
    if (!buckets.has(key)) {
      buckets.set(key, { key, label: dateLabel(key, locale, style), orders: 0, revenue: 0 });
    }
  });

  for (const order of orders) {
    const bucket = buckets.get(bucketByDay.get(reportDateKey(order.date)) ?? "");
    if (!bucket) continue;
    bucket.orders += 1;
    bucket.revenue = roundCurrency(bucket.revenue + order.total);
  }

  return [...buckets.values()];
}

function rankedBreakdowns(orders: CommerceOrder[]): {
  billingMix: BillingBreakdown[];
  categories: CategoryBreakdown[];
  topProducts: ProductBreakdown[];
} {
  const productMap = new Map<number, ProductBreakdown & { orderIds: Set<number> }>();
  const categoryMap = new Map<string, CategoryBreakdown>();
  const billingMap = new Map<string, BillingBreakdown>();

  for (const order of orders) {
    for (const line of order.lines) {
      const product = productMap.get(line.productId) ?? {
        id: line.productId,
        name: line.productName,
        orders: 0,
        orderIds: new Set<number>(),
        quantity: 0,
        revenue: 0,
      };
      product.name = line.productName;
      product.orderIds.add(order.id);
      product.orders = product.orderIds.size;
      product.quantity += line.quantity;
      product.revenue = roundCurrency(product.revenue + line.subtotal);
      productMap.set(line.productId, product);

      const categoryKey = line.categoryId === null ? `name:${line.categoryName}` : `id:${line.categoryId}`;
      const category = categoryMap.get(categoryKey) ?? {
        id: line.categoryId,
        name: line.categoryName,
        quantity: 0,
        revenue: 0,
      };
      category.quantity += line.quantity;
      category.revenue = roundCurrency(category.revenue + line.subtotal);
      categoryMap.set(categoryKey, category);

      const billing = billingMap.get(line.billingPlan) ?? {
        plan: line.billingPlan,
        quantity: 0,
        revenue: 0,
      };
      billing.quantity += line.quantity;
      billing.revenue = roundCurrency(billing.revenue + line.subtotal);
      billingMap.set(line.billingPlan, billing);
    }
  }

  const topProducts = [...productMap.values()]
    .map((product) => ({ id: product.id, name: product.name, orders: product.orders, quantity: product.quantity, revenue: product.revenue }))
    .sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity)
    .slice(0, 20);
  const categories = [...categoryMap.values()].sort((a, b) => b.revenue - a.revenue);
  const billingMix = [...billingMap.values()].sort((a, b) => b.revenue - a.revenue);
  return { topProducts, categories, billingMix };
}

export function aggregateCommerceReport(input: {
  locale: Locale;
  orders: CommerceOrder[];
  range: ReportRange;
  subscriptionHealth: SubscriptionHealthData;
  generatedAt?: Date;
}): CommerceReportData {
  const completed = input.orders.filter((order) => isCompletedOrderStatus(order.status));
  const currentOrders = completed.filter((order) => {
    const key = reportDateKey(order.date);
    return key >= input.range.from && key <= input.range.to;
  });
  const previousOrders = completed.filter((order) => {
    const key = reportDateKey(order.date);
    return key >= input.range.previousFrom && key <= input.range.previousTo;
  });
  const current = summarize(currentOrders);
  const previous = summarize(previousOrders);
  const breakdowns = rankedBreakdowns(currentOrders);

  return {
    locale: input.locale,
    range: input.range,
    current: {
      ...current,
      changes: {
        grossRevenue: percentChange(current.grossRevenue, previous.grossRevenue),
        orderCount: percentChange(current.orderCount, previous.orderCount),
        averageOrderValue: percentChange(current.averageOrderValue, previous.averageOrderValue),
        uniqueCustomers: percentChange(current.uniqueCustomers, previous.uniqueCustomers),
      },
    },
    previous,
    subscriptions: input.subscriptionHealth,
    trend: createTrend(currentOrders, input.range, input.locale),
    ...breakdowns,
    generatedAt: (input.generatedAt ?? new Date()).toISOString(),
  };
}
