"use client";

// Visible out-of-stock message with a direct sales contact number.
import { PhoneCall } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

// Placeholder sales line, not a real number.
const SALES_PHONE = "+33 1 86 76 12 34";

type ContactSalesInfoProps = {
  className?: string;
};

export default function ContactSalesInfo({ className }: ContactSalesInfoProps) {
  const t = useTranslations("product");

  return (
    <p
      className={cn(
        "inline-flex items-start gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm leading-relaxed text-black ring-1 ring-slate-200",
        className,
      )}
    >
      <PhoneCall
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-black"
      />
      <span>{t("contactSalesInfo", { phone: SALES_PHONE })}</span>
    </p>
  );
}
