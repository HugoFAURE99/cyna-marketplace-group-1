"use client";

// Small "(i)" affordance shown next to out-of-stock items: a tooltip inviting
// the shopper to contact sales directly, with a (placeholder) phone number.
import { Info } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Placeholder sales line — not a real number.
const SALES_PHONE = "+33 1 86 76 12 34";

type ContactSalesInfoProps = {
  className?: string;
};

export default function ContactSalesInfo({ className }: ContactSalesInfoProps) {
  const t = useTranslations("product");

  return (
    <TooltipProvider delay={150}>
      <Tooltip>
        <TooltipTrigger
          aria-label={t("contactSalesAria")}
          className={cn(
            "inline-flex size-5 items-center justify-center rounded-full text-slate-400 transition hover:text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700",
            className,
          )}
          type="button"
        >
          <Info aria-hidden="true" className="size-4" />
        </TooltipTrigger>
        <TooltipContent className="max-w-[260px] text-center leading-relaxed">
          {t("contactSalesInfo", { phone: SALES_PHONE })}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
