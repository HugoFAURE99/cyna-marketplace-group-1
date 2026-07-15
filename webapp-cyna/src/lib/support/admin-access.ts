import type { SupportTicketStatus } from "@/lib/support/constants";

export const OPEN_ADMIN_ACCESS_STATUSES = [
  "open",
  "in_progress",
  "waiting_customer",
] as const satisfies readonly SupportTicketStatus[];

export function isOpenAdminAccessStatus(status: SupportTicketStatus): boolean {
  return OPEN_ADMIN_ACCESS_STATUSES.includes(status as (typeof OPEN_ADMIN_ACCESS_STATUSES)[number]);
}
