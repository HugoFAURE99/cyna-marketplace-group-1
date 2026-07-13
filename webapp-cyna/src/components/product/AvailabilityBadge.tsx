// Presentational "unavailable" badge. The caller decides when to render it
// (i.e. when est_disponible is false) and passes the localised label.
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
        "inline-flex items-center rounded-full bg-black px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white",
        className,
      )}
    >
      {label}
    </span>
  );
}
