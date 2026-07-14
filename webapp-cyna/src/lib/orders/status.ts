export type OrderStatusKey = "canceled" | "failed" | "paid" | "pending";
export type NormalizedOrderStatus = OrderStatusKey | "unknown";

export type OrderStatusFilterEntry = {
  key: NormalizedOrderStatus;
  raw: string;
  value: string;
};

function statusToken(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr-FR")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

const ALIASES: Record<OrderStatusKey, Set<string>> = {
  canceled: new Set([
    "annule",
    "annulee",
    "canceled",
    "cancelled",
    "expire",
    "expiree",
    "expired",
    "void",
  ]),
  failed: new Set(["echoue", "echouee", "error", "failed"]),
  paid: new Set([
    "active",
    "complete",
    "completed",
    "paid",
    "payee",
    "valide",
    "validee",
  ]),
  pending: new Set(["en attente", "en cours", "pending", "processing"]),
};

export function normalizeOrderStatus(value: string): NormalizedOrderStatus {
  const token = statusToken(value);
  for (const key of Object.keys(ALIASES) as OrderStatusKey[]) {
    if (ALIASES[key].has(token)) return key;
  }
  return "unknown";
}

export function orderStatusFilterValue(value: string): string {
  const key = normalizeOrderStatus(value);
  return key === "unknown" ? `unknown:${statusToken(value)}` : key;
}

export function getOrderStatusFilterEntries(
  statuses: string[],
): OrderStatusFilterEntry[] {
  const entries = new Map<string, OrderStatusFilterEntry>();
  for (const raw of statuses) {
    const value = orderStatusFilterValue(raw);
    if (!entries.has(value)) {
      entries.set(value, { key: normalizeOrderStatus(raw), raw, value });
    }
  }
  return [...entries.values()].sort((a, b) => a.value.localeCompare(b.value));
}

export function isPaidOrderStatus(value: string): boolean {
  return normalizeOrderStatus(value) === "paid";
}
