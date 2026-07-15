// Instant loading placeholder for the auth pages (login, register, reset
// password). Mirrors the shared layout — centered title/subtitle above a card —
// so navigation lands on the correct shell instead of flashing the homepage
// skeleton inherited from the (public) group loader. Deterministic: fixed
// sizes, no randomness.

function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />;
}

export function AuthFormSkeleton() {
  return (
    <main
      aria-hidden
      className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="w-full max-w-md space-y-8">
        {/* Title + subtitle */}
        <div className="flex flex-col items-center gap-2">
          <Bar className="h-8 w-48" />
          <Bar className="h-4 w-64" />
        </div>

        {/* Form card */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex flex-col gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex flex-col gap-2">
                <Bar className="h-3 w-24" />
                <Bar className="h-9 w-full" />
              </div>
            ))}
            <Bar className="h-9 w-full" />
          </div>
        </div>
      </div>
    </main>
  );
}
