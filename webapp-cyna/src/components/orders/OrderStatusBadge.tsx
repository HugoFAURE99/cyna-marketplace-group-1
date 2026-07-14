"use client";

import { useTranslations } from "next-intl";

import { normalizeOrderStatus } from "@/lib/orders/status";

const STATUS_STYLES = {
  canceled: "bg-slate-100 text-slate-700",
  failed: "bg-red-100 text-red-800",
  paid: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  unknown: "bg-gray-100 text-gray-700",
} as const;

export default function OrderStatusBadge({ status }: { status: string }) {
  const t = useTranslations("orderStatus");
  const key = normalizeOrderStatus(status);
  const label = key === "unknown" ? status : t(key);

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[key]}`}
    >
      {label}
    </span>
  );
}
