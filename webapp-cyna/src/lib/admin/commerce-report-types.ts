import type { Locale } from "@/lib/i18n/translations";

export type ReportPreset = "7d" | "30d" | "90d" | "ytd" | "custom";

export type ReportRange = {
  from: string;
  to: string;
  fromIso: string;
  toExclusiveIso: string;
  previousFrom: string;
  previousTo: string;
  previousFromIso: string;
  previousToExclusiveIso: string;
  preset: ReportPreset;
  timeZone: "Europe/Paris";
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
  id: number | null;
  name: string;
  quantity: number;
  revenue: number;
};

export type BillingBreakdown = {
  plan: string;
  quantity: number;
  revenue: number;
};

export type SubscriptionHorizon = 7 | 30 | 60 | 90;

export type SubscriptionDueItem = {
  billingPlan: string;
  contactEmail: string | null;
  customerName: string | null;
  daysRemaining: number;
  dueDate: string;
  id: number;
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
  topProducts: ProductBreakdown[];
  categories: CategoryBreakdown[];
  billingMix: BillingBreakdown[];
  generatedAt: string;
};
