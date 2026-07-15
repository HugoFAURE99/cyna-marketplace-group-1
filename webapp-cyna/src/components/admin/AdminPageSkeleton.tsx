import { Skeleton } from "@/components/ui/skeleton";

// Instant loading fallback for admin table pages. Rendered by each route's
// loading.tsx so navigation lands on the page immediately and the table area
// shows a pulsing placeholder while the server fetches the data.
export default function AdminPageSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div>
      {/* Title + primary action */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full sm:w-36" />
      </div>

      {/* Toolbar: search + filter */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-10 w-full sm:w-72" />
        <Skeleton className="h-10 w-full sm:w-48" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border">
        {/* Header row */}
        <div className="flex items-center gap-4 border-b border-border bg-muted/40 px-4 py-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-4 flex-1" />
          ))}
        </div>
        {/* Body rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-b-0"
          >
            {Array.from({ length: 5 }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
