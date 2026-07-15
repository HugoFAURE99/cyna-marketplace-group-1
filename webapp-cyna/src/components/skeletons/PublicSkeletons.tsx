// Instant loading placeholders for the public storefront. Rendered by each
// route's loading.tsx so navigation lands on the page shell immediately and
// the data-heavy areas pulse until the server finishes fetching. Uses the
// slate palette to blend with the public site (not the admin theme).

function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="aspect-[4/3] w-full animate-pulse bg-slate-200" />
      <div className="space-y-3 p-4">
        <Bar className="h-4 w-3/4" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
        <Bar className="h-5 w-1/3" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <main aria-busy="true" className="flex-1">
      {/* Carousel banner */}
      <div className="h-72 w-full animate-pulse bg-slate-200 sm:h-96" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-12 sm:px-6 lg:px-8">
        {/* Intro */}
        <div className="space-y-4">
          <Bar className="h-8 w-64" />
          <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-full max-w-xl animate-pulse rounded bg-slate-100" />
        </div>
        {/* Top products */}
        <div className="space-y-6">
          <Bar className="h-7 w-52" />
          <ProductGridSkeleton count={4} />
        </div>
        {/* Categories */}
        <div className="space-y-6">
          <Bar className="h-7 w-52" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-lg bg-slate-200"
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export function CategoryPageSkeleton() {
  return (
    <main aria-busy="true" className="flex-1">
      {/* Hero */}
      <div className="relative min-h-72 bg-slate-900 sm:min-h-80">
        <div className="mx-auto flex min-h-72 w-full max-w-7xl items-end px-4 py-10 sm:min-h-80 sm:px-6 sm:py-14 lg:px-8">
          <div className="w-full max-w-2xl space-y-3">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-700" />
            <div className="h-10 w-72 animate-pulse rounded bg-slate-700" />
            <div className="h-4 w-full max-w-md animate-pulse rounded bg-slate-800" />
          </div>
        </div>
      </div>
      {/* Products grid */}
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Bar className="h-7 w-40" />
          <Bar className="h-10 w-40" />
        </div>
        <ProductGridSkeleton />
      </section>
    </main>
  );
}

export function SearchSkeleton() {
  return (
    <main aria-busy="true" className="flex-1">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Bar className="mb-6 h-8 w-56" />
        {/* Toolbar: search + filters + sort */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Bar className="h-11 w-full sm:w-96" />
          <Bar className="h-11 w-full sm:w-48" />
          <Bar className="h-11 w-full sm:w-48" />
        </div>
        <ProductGridSkeleton count={8} />
      </div>
    </main>
  );
}

export function ProductDetailSkeleton() {
  return (
    <main aria-busy="true" className="flex-1">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10">
          {/* Gallery + description */}
          <div className="space-y-8">
            <div className="aspect-[4/3] w-full animate-pulse rounded-xl bg-slate-200" />
            <div className="space-y-3">
              <Bar className="h-6 w-48" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-11/12 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
          {/* Buy box */}
          <aside className="space-y-5">
            <div className="space-y-2">
              <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
              <Bar className="h-8 w-3/4" />
              <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
              <Bar className="h-5 w-32" />
              <div className="grid grid-cols-2 gap-3">
                <Bar className="h-16 w-full" />
                <Bar className="h-16 w-full" />
              </div>
              <Bar className="h-11 w-full" />
              <Bar className="h-12 w-full" />
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
