import type { Locale } from "@/lib/i18n/translations";

export type ReportPreset = "7d" | "5w" | "custom";

export type ReportGranularity = "day" | "week" | "month";

export type ReportRangeErrorCode =
  | "INVALID_DATE_FORMAT"
  | "RANGE_REVERSED"
  | "RANGE_IN_FUTURE"
  | "RANGE_TOO_LONG";

export type ReportRange = {
  from: string;
  to: string;
  fromIso: string;
  toExclusiveIso: string;
  previousFrom: string;
  previousTo: string;
  previousFromIso: string;
  previousToExclusiveIso: string;
  granularity: ReportGranularity;
  preset: ReportPreset;
  timeZone: "Europe/Paris";
  today: string;
};

export type CommerceKpis = {
  grossRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  uniqueCustomers: number;
};

export type KpiComparison = CommerceKpis & {
  changes: Record<keyof CommerceKpis, number | null>;
};

export type CommerceTrendPoint = {
  averageOrderValue: number;
  key: string;
  label: string;
  orders: number;
  revenue: number;
};

export type ProductBreakdown = {
  id: number;
  name: string;
  orders: number;
  quantity: number;
  revenue: number;
};

export type CategoryBreakdown = {
  averageOrderValue: number;
  color: string;
  id: number | null;
  isOther: boolean;
  key: string;
  name: string;
  orderCount: number;
  quantity: number;
  revenue: number;
};

export type CategoryAverageMetric = {
  averageOrderValue: number;
  orderCount: number;
  revenue: number;
};

export type CategoryAveragePoint = {
  key: string;
  label: string;
  values: Record<string, CategoryAverageMetric>;
};

export type CategoryAverageSeries = {
  categories: CategoryBreakdown[];
  points: CategoryAveragePoint[];
};

export type BillingBreakdown = {
  plan: string;
  quantity: number;
  revenue: number;
};

export type SubscriptionHorizon = 7 | 30 | 60 | 90;

export type SubscriptionDueKind = "renewal" | "scheduled_ending";

export type SubscriptionDueItem = {
  billingPlan: string;
  contactEmail: string | null;
  customerName: string | null;
  daysRemaining: number;
  dueDate: string;
  id: number;
  kind: SubscriptionDueKind;
  orderId: number;
  productId: number | null;
  productName: string;
  seats: number;
  value: number;
};

export type SubscriptionCountBreakdown = {
  count: number;
  label: string;
  seats: number;
  value: number;
};

export type SubscriptionProductBreakdown = SubscriptionCountBreakdown & {
  productId: number | null;
};

export type SubscriptionHealthData = {
  active: number;
  activeSeats: number;
  annualOutlook: SubscriptionDueItem[];
  annualRenewalCount: number;
  annualRenewalValue: number;
  annualScheduledEndingCount: number;
  annualScheduledEndingValue: number;
  annualTo: string;
  asOf: string;
  billingBreakdown: SubscriptionCountBreakdown[];
  horizon: SubscriptionHorizon;
  productBreakdown: SubscriptionProductBreakdown[];
  scheduledCancellations: number;
  scheduledEndingCount: number;
  scheduledEndingValue: number;
  scheduledEndings: SubscriptionDueItem[];
  statusBreakdown: { count: number; label: string }[];
  to: string;
  upcomingRenewalCount: number;
  upcomingRenewalValue: number;
  upcomingRenewals: SubscriptionDueItem[];
};

export type CommerceReportData = {
  locale: Locale;
  range: ReportRange;
  current: KpiComparison;
  previous: CommerceKpis;
  subscriptions: SubscriptionHealthData;
  trend: CommerceTrendPoint[];
  categoryAverages: CategoryAverageSeries;
  topProducts: ProductBreakdown[];
  categories: CategoryBreakdown[];
  billingMix: BillingBreakdown[];
  generatedAt: string;
};
