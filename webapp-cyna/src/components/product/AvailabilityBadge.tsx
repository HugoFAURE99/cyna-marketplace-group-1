// Presentational "unavailable" badge. The caller decides when to render it
// (i.e. when quantite_produit === 0) and passes the localised label.
import { cn } from "@/lib/utils";

type AvailabilityBadgeProps = {
  label: string;
  className?: string;
};

export default function AvailabilityBadge({
  label,
  className,
}: AvailabilityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-slate-900/85 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm",
        className,
      )}
    >
      {label}
    </span>
  );
}
