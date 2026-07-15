import type {
  BillingBreakdown,
  CategoryAverageSeries,
  CategoryBreakdown,
  CommerceKpis,
  CommerceReportData,
  CommerceTrendPoint,
  ProductBreakdown,
  ReportRange,
  SubscriptionHealthData,
} from "@/lib/admin/commerce-report-types";
import {
  enumerateReportDays,
  reportBucketKey,
  reportDateKey,
} from "@/lib/admin/report-range";
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

type BucketDefinition = {
  firstDay: string;
  key: string;
  label: string;
  lastDay: string;
};

type CategoryAccumulator = {
  id: number | null;
  name: string;
  orderIds: Set<number>;
  quantity: number;
  rawKey: string;
  revenue: number;
};

type MetricAccumulator = {
  orderIds: Set<number>;
  revenue: number;
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

function dateAtNoon(key: string): Date {
  return new Date(`${key}T12:00:00Z`);
}

function shortDate(key: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(
    dateAtNoon(key),
  );
}

function bucketLabel(
  firstDay: string,
  lastDay: string,
  range: ReportRange,
  locale: Locale,
): string {
  if (range.granularity === "month") {
    return new Intl.DateTimeFormat(locale, { month: "short", year: "numeric" }).format(
      dateAtNoon(firstDay),
    );
  }
  if (range.granularity === "week") {
    return `${shortDate(firstDay, locale)} - ${shortDate(lastDay, locale)}`;
  }
  return shortDate(firstDay, locale);
}

function createBucketDefinitions(range: ReportRange, locale: Locale): BucketDefinition[] {
  const buckets = new Map<string, Omit<BucketDefinition, "label">>();
  for (const day of enumerateReportDays(range.from, range.to)) {
    const key = reportBucketKey(day, range.granularity);
    const current = buckets.get(key);
    if (current) {
      current.lastDay = day;
    } else {
      buckets.set(key, { firstDay: day, key, lastDay: day });
    }
  }
  return [...buckets.values()].map((bucket) => ({
    ...bucket,
    label: bucketLabel(bucket.firstDay, bucket.lastDay, range, locale),
  }));
}

function createTrend(
  orders: CommerceOrder[],
  range: ReportRange,
  locale: Locale,
): CommerceTrendPoint[] {
  const definitions = createBucketDefinitions(range, locale);
  const buckets = new Map(
    definitions.map((definition) => [
      definition.key,
      { ...definition, orders: 0, revenue: 0 },
    ]),
  );

  for (const order of orders) {
    const key = reportBucketKey(reportDateKey(order.date), range.granularity);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.orders += 1;
    bucket.revenue = roundCurrency(bucket.revenue + order.total);
  }

  return [...buckets.values()].map((bucket) => ({
    averageOrderValue: bucket.orders ? roundCurrency(bucket.revenue / bucket.orders) : 0,
    key: bucket.key,
    label: bucket.label,
    orders: bucket.orders,
    revenue: bucket.revenue,
  }));
}

function rawCategoryKey(line: CommerceOrderLine): string {
  return line.categoryId === null
    ? `name:${line.categoryName.trim().toLocaleLowerCase()}`
    : `id:${line.categoryId}`;
}

function hashKey(value: string): number {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const CATEGORY_GRADIENT_SIZE = 10;
const CATEGORY_GRADIENT_START = [49, 46, 129] as const;
const CATEGORY_GRADIENT_END = [232, 121, 249] as const;
const DEFAULT_CATEGORY_COLOR = "#7c3aed";

function rgbToHex(red: number, green: number, blue: number): string {
  return `#${[red, green, blue]
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

function createCategoryGradient(size: number): string[] {
  return Array.from({ length: size }, (_, index) => {
    const ratio = size === 1 ? 0 : index / (size - 1);
    return rgbToHex(
      CATEGORY_GRADIENT_START[0] + (CATEGORY_GRADIENT_END[0] - CATEGORY_GRADIENT_START[0]) * ratio,
      CATEGORY_GRADIENT_START[1] + (CATEGORY_GRADIENT_END[1] - CATEGORY_GRADIENT_START[1]) * ratio,
      CATEGORY_GRADIENT_START[2] + (CATEGORY_GRADIENT_END[2] - CATEGORY_GRADIENT_START[2]) * ratio,
    );
  });
}

function assignDistinctCategoryColors(categories: CategoryAccumulator[]): Map<string, string> {
  const assignments = new Map<string, string>();
  const gradient = createCategoryGradient(CATEGORY_GRADIENT_SIZE);

  categories.forEach((category, index) => {
    const gradientIndex = categories.length === 1
      ? Math.floor((CATEGORY_GRADIENT_SIZE - 1) / 2)
      : Math.round((index * (CATEGORY_GRADIENT_SIZE - 1)) / (categories.length - 1));
    assignments.set(category.rawKey, gradient[gradientIndex]);
  });

  return assignments;
}

function categorySeriesKey(category: CategoryAccumulator): string {
  return category.id === null
    ? `category_name_${hashKey(category.rawKey).toString(36)}`
    : `category_${category.id}`;
}

function toCategoryBreakdown(
  category: CategoryAccumulator,
  options: { color?: string; isOther?: boolean; key?: string } = {},
): CategoryBreakdown {
  const key = options.key ?? categorySeriesKey(category);
  return {
    averageOrderValue: category.orderIds.size
      ? roundCurrency(category.revenue / category.orderIds.size)
      : 0,
    color: options.isOther ? "#64748b" : options.color ?? DEFAULT_CATEGORY_COLOR,
    id: options.isOther ? null : category.id,
    isOther: options.isOther ?? false,
    key,
    name: category.name,
    orderCount: category.orderIds.size,
    quantity: category.quantity,
    revenue: roundCurrency(category.revenue),
  };
}

function rankedBreakdowns(orders: CommerceOrder[], locale: Locale): {
  billingMix: BillingBreakdown[];
  categories: CategoryBreakdown[];
  categoryAssignments: Map<string, string>;
  topProducts: ProductBreakdown[];
} {
  const productMap = new Map<number, ProductBreakdown & { orderIds: Set<number> }>();
  const categoryMap = new Map<string, CategoryAccumulator>();
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

      const categoryKey = rawCategoryKey(line);
      const category = categoryMap.get(categoryKey) ?? {
        id: line.categoryId,
        name: line.categoryName,
        orderIds: new Set<number>(),
        quantity: 0,
        rawKey: categoryKey,
        revenue: 0,
      };
      category.name = line.categoryName;
      category.orderIds.add(order.id);
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
    .map((product) => ({
      id: product.id,
      name: product.name,
      orders: product.orders,
      quantity: product.quantity,
      revenue: product.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity)
    .slice(0, 20);
  const rankedCategories = [...categoryMap.values()].sort(
    (a, b) => b.revenue - a.revenue || b.quantity - a.quantity,
  );
  const primaryCategories = rankedCategories.slice(0, 7);
  const remainingCategories = rankedCategories.slice(7);
  const categoryColors = assignDistinctCategoryColors(primaryCategories);
  const categoryAssignments = new Map<string, string>();
  const categories = primaryCategories.map((category) => {
    const breakdown = toCategoryBreakdown(category, {
      color: categoryColors.get(category.rawKey),
    });
    categoryAssignments.set(category.rawKey, breakdown.key);
    return breakdown;
  });

  if (remainingCategories.length) {
    const other: CategoryAccumulator = {
      id: null,
      name: locale === "fr" ? "Autres" : "Other",
      orderIds: new Set<number>(),
      quantity: 0,
      rawKey: "other",
      revenue: 0,
    };
    for (const category of remainingCategories) {
      categoryAssignments.set(category.rawKey, "other");
      category.orderIds.forEach((id) => other.orderIds.add(id));
      other.quantity += category.quantity;
      other.revenue += category.revenue;
    }
    categories.push(toCategoryBreakdown(other, { isOther: true, key: "other" }));
  }

  const billingMix = [...billingMap.values()].sort((a, b) => b.revenue - a.revenue);
  return { topProducts, categories, categoryAssignments, billingMix };
}

function createCategoryAverageSeries(
  orders: CommerceOrder[],
  range: ReportRange,
  locale: Locale,
  categories: CategoryBreakdown[],
  categoryAssignments: Map<string, string>,
): CategoryAverageSeries {
  const definitions = createBucketDefinitions(range, locale);
  const buckets = new Map<string, Map<string, MetricAccumulator>>(
    definitions.map((definition) => [definition.key, new Map()]),
  );

  for (const order of orders) {
    const bucketKey = reportBucketKey(reportDateKey(order.date), range.granularity);
    const bucket = buckets.get(bucketKey);
    if (!bucket) continue;
    const groupsInOrder = new Set<string>();
    for (const line of order.lines) {
      const displayKey = categoryAssignments.get(rawCategoryKey(line));
      if (!displayKey) continue;
      const metric = bucket.get(displayKey) ?? { orderIds: new Set<number>(), revenue: 0 };
      metric.revenue = roundCurrency(metric.revenue + line.subtotal);
      bucket.set(displayKey, metric);
      groupsInOrder.add(displayKey);
    }
    for (const displayKey of groupsInOrder) {
      bucket.get(displayKey)?.orderIds.add(order.id);
    }
  }

  return {
    categories,
    points: definitions.map((definition) => {
      const bucket = buckets.get(definition.key) ?? new Map<string, MetricAccumulator>();
      const values = Object.fromEntries(
        categories.map((category) => {
          const metric = bucket.get(category.key);
          const orderCount = metric?.orderIds.size ?? 0;
          const revenue = roundCurrency(metric?.revenue ?? 0);
          return [category.key, {
            averageOrderValue: orderCount ? roundCurrency(revenue / orderCount) : 0,
            orderCount,
            revenue,
          }];
        }),
      );
      return { key: definition.key, label: definition.label, values };
    }),
  };
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
  const breakdowns = rankedBreakdowns(currentOrders, input.locale);

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
    categoryAverages: createCategoryAverageSeries(
      currentOrders,
      input.range,
      input.locale,
      breakdowns.categories,
      breakdowns.categoryAssignments,
    ),
    topProducts: breakdowns.topProducts,
    categories: breakdowns.categories,
    billingMix: breakdowns.billingMix,
    generatedAt: (input.generatedAt ?? new Date()).toISOString(),
  };
}
