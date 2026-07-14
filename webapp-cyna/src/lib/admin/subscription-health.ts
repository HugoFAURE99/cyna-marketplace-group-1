import type {
  SubscriptionCountBreakdown,
  SubscriptionDueItem,
  SubscriptionHealthData,
  SubscriptionHorizon,
  SubscriptionProductBreakdown,
} from "@/lib/admin/commerce-report-types";
import { reportDateKey } from "@/lib/admin/report-range";

export type SubscriptionHealthSource = {
  billingPlan: string;
  contactEmail: string | null;
  customerName: string | null;
  endDate: string | null;
  id: number;
  orderId: number;
  priceCents: number;
  productId: number | null;
  productName: string;
  scheduledCancellation: boolean;
  seats: number;
  status: string;
};

const ACTIVE_STATUSES = new Set(["active", "actif", "trialing"]);

export function isActiveSubscriptionStatus(status: string): boolean {
  return ACTIVE_STATUSES.has(status.trim().toLocaleLowerCase("fr-FR"));
}

function addDays(key: string, days: number): string {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function isSubscriptionDueWithinHorizon(
  endDate: string | null,
  status: string,
  horizon: SubscriptionHorizon,
  generatedAt: Date = new Date(),
): boolean {
  if (!endDate || !isActiveSubscriptionStatus(status)) return false;
  const asOf = reportDateKey(generatedAt);
  const dueDate = reportDateKey(endDate);
  return dueDate >= asOf && dueDate <= addDays(asOf, horizon);
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function dueItem(source: SubscriptionHealthSource, asOf: string): SubscriptionDueItem {
  const dueDate = reportDateKey(source.endDate!);
  return {
    billingPlan: source.billingPlan,
    contactEmail: source.contactEmail,
    customerName: source.customerName,
    daysRemaining: daysBetween(asOf, dueDate),
    dueDate,
    id: source.id,
    orderId: source.orderId,
    productId: source.productId,
    productName: source.productName,
    seats: Math.max(1, source.seats),
    value: roundCurrency((Math.max(0, source.priceCents) / 100) * Math.max(1, source.seats)),
  };
}

export function aggregateSubscriptionHealth(input: {
  generatedAt?: Date;
  horizon: SubscriptionHorizon;
  subscriptions: SubscriptionHealthSource[];
}): SubscriptionHealthData {
  const generatedAt = input.generatedAt ?? new Date();
  const asOf = reportDateKey(generatedAt);
  const to = addDays(asOf, input.horizon);
  const active = input.subscriptions.filter((item) => isActiveSubscriptionStatus(item.status));
  const due = active
    .filter((item) => isSubscriptionDueWithinHorizon(item.endDate, item.status, input.horizon, generatedAt))
    .map((item) => ({ source: item, item: dueItem(item, asOf) }))
    .sort((a, b) => a.item.dueDate.localeCompare(b.item.dueDate) || a.item.id - b.item.id);
  const upcomingRenewals = due.filter(({ source }) => !source.scheduledCancellation).map(({ item }) => item);
  const scheduledEndings = due.filter(({ source }) => source.scheduledCancellation).map(({ item }) => item);

  const statusMap = new Map<string, number>();
  input.subscriptions.forEach((item) => statusMap.set(item.status, (statusMap.get(item.status) ?? 0) + 1));
  const billingMap = new Map<string, SubscriptionCountBreakdown>();
  const productMap = new Map<string, SubscriptionProductBreakdown>();
  active.forEach((item) => {
    const seats = Math.max(1, item.seats);
    const value = roundCurrency((Math.max(0, item.priceCents) / 100) * seats);
    const billing = billingMap.get(item.billingPlan) ?? { count: 0, label: item.billingPlan, seats: 0, value: 0 };
    billing.count += 1; billing.seats += seats; billing.value = roundCurrency(billing.value + value); billingMap.set(item.billingPlan, billing);
    const key = item.productId === null ? `name:${item.productName}` : `id:${item.productId}`;
    const product = productMap.get(key) ?? { count: 0, label: item.productName, productId: item.productId, seats: 0, value: 0 };
    product.count += 1; product.seats += seats; product.value = roundCurrency(product.value + value); productMap.set(key, product);
  });

  return {
    active: active.length,
    activeSeats: active.reduce((sum, item) => sum + Math.max(1, item.seats), 0),
    asOf,
    billingBreakdown: [...billingMap.values()].sort((a, b) => b.value - a.value),
    horizon: input.horizon,
    productBreakdown: [...productMap.values()].sort((a, b) => b.value - a.value),
    scheduledCancellations: active.filter((item) => item.scheduledCancellation).length,
    scheduledEndingCount: scheduledEndings.length,
    scheduledEndingValue: roundCurrency(scheduledEndings.reduce((sum, item) => sum + item.value, 0)),
    scheduledEndings,
    statusBreakdown: [...statusMap.entries()].map(([label, count]) => ({ count, label })).sort((a, b) => b.count - a.count),
    to,
    upcomingRenewalCount: upcomingRenewals.length,
    upcomingRenewalValue: roundCurrency(upcomingRenewals.reduce((sum, item) => sum + item.value, 0)),
    upcomingRenewals,
  };
}
