import type {
  SubscriptionCountBreakdown,
  SubscriptionDueItem,
  SubscriptionHealthData,
  SubscriptionHorizon,
  SubscriptionProductBreakdown,
} from "@/lib/admin/commerce-report-types";
import { reportDateKey } from "@/lib/admin/report-range";
import {
  isActiveSubscriptionStatus,
  normalizeSubscriptionStatus,
} from "@/lib/subscriptions/status";

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

export { isActiveSubscriptionStatus } from "@/lib/subscriptions/status";

function addDays(key: string, days: number): string {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function addCalendarYear(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year + 1, month, 0)).getUTCDate();
  return `${year + 1}-${String(month).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

export function isAnnualBillingPlan(plan: string): boolean {
  return ["annuel", "annual", "year", "yearly"].includes(
    plan.trim().toLocaleLowerCase("fr-FR"),
  );
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

export function isAnnualSubscriptionWithinOutlook(
  endDate: string | null,
  status: string,
  billingPlan: string,
  generatedAt: Date = new Date(),
): boolean {
  if (
    !endDate ||
    !isActiveSubscriptionStatus(status) ||
    !isAnnualBillingPlan(billingPlan)
  ) {
    return false;
  }
  const asOf = reportDateKey(generatedAt);
  const dueDate = reportDateKey(endDate);
  return dueDate >= asOf && dueDate <= addCalendarYear(asOf);
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
    kind: source.scheduledCancellation ? "scheduled_ending" : "renewal",
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
  const annualTo = addCalendarYear(asOf);
  const active = input.subscriptions.filter((item) => isActiveSubscriptionStatus(item.status));
  const due = active
    .filter((item) => isSubscriptionDueWithinHorizon(item.endDate, item.status, input.horizon, generatedAt))
    .map((item) => ({ source: item, item: dueItem(item, asOf) }))
    .sort((a, b) => a.item.dueDate.localeCompare(b.item.dueDate) || a.item.id - b.item.id);
  const upcomingRenewals = due.filter(({ source }) => !source.scheduledCancellation).map(({ item }) => item);
  const scheduledEndings = due.filter(({ source }) => source.scheduledCancellation).map(({ item }) => item);
  const annualOutlook = active
    .filter((item) =>
      isAnnualSubscriptionWithinOutlook(
        item.endDate,
        item.status,
        item.billingPlan,
        generatedAt,
      ),
    )
    .map((item) => dueItem(item, asOf))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id - b.id);
  const annualRenewals = annualOutlook.filter((item) => item.kind === "renewal");
  const annualScheduledEndings = annualOutlook.filter((item) => item.kind === "scheduled_ending");

  const statusMap = new Map<string, number>();
  input.subscriptions.forEach((item) => {
    const status = normalizeSubscriptionStatus(item.status);
    statusMap.set(status, (statusMap.get(status) ?? 0) + 1);
  });
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
    annualOutlook,
    annualRenewalCount: annualRenewals.length,
    annualRenewalValue: roundCurrency(annualRenewals.reduce((sum, item) => sum + item.value, 0)),
    annualScheduledEndingCount: annualScheduledEndings.length,
    annualScheduledEndingValue: roundCurrency(annualScheduledEndings.reduce((sum, item) => sum + item.value, 0)),
    annualTo,
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
