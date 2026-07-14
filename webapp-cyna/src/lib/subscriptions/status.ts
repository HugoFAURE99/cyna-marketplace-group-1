export const STRIPE_SUBSCRIPTION_STATUSES = [
  "incomplete",
  "incomplete_expired",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "paused",
] as const;

export type CanonicalSubscriptionStatus = (typeof STRIPE_SUBSCRIPTION_STATUSES)[number];

const STATUS_ALIASES: Record<string, CanonicalSubscriptionStatus> = {
  actif: "active",
  active: "active",
  annule: "canceled",
  "annulé": "canceled",
  canceled: "canceled",
  cancelled: "canceled",
  "en attente": "incomplete",
  expire: "canceled",
  "expiré": "canceled",
  expired: "canceled",
  pending: "incomplete",
};

export function normalizeSubscriptionStatus(status: string): CanonicalSubscriptionStatus | string {
  const normalized = status.trim().toLocaleLowerCase("fr-FR");
  return STATUS_ALIASES[normalized] ?? normalized;
}

export function isActiveSubscriptionStatus(status: string): boolean {
  const normalized = normalizeSubscriptionStatus(status);
  return normalized === "active" || normalized === "trialing";
}

export function isTerminalSubscriptionStatus(status: string): boolean {
  const normalized = normalizeSubscriptionStatus(status);
  return normalized === "canceled" || normalized === "incomplete_expired";
}
