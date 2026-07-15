import { Info, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

// Unified, on-brand feedback banner for the auth flows. We deliberately keep a
// single calm purple palette for both info and error states (no red/green
// bubbles) so the messaging stays aligned with CYNA's design system — only the
// icon changes to signal intent.
export function AuthMessage({
  variant = "info",
  className,
  children,
}: {
  variant?: "info" | "error";
  className?: string;
  children: React.ReactNode;
}) {
  const Icon = variant === "error" ? TriangleAlert : Info;

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-left text-sm text-purple-900",
        className
      )}
    >
      <Icon
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-purple-700"
      />
      <span>{children}</span>
    </div>
  );
}
