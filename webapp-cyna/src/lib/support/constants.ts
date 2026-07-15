export const SUPPORT_TICKET_CATEGORIES = [
  "billing",
  "order",
  "subscription",
  "account",
  "data_access",
  "technical",
  "admin_access",
  "mfa_reset",
  "other",
] as const;

export const SUPPORT_TICKET_STATUSES = [
  "open",
  "in_progress",
  "waiting_customer",
  "resolved",
  "closed",
] as const;

export type SupportTicketCategory = (typeof SUPPORT_TICKET_CATEGORIES)[number];
export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];
