export default function Loading() {
  return (
    <div className="min-h-full flex flex-col">
      {/* Header skeleton */}
      <div className="sticky top-0 z-[var(--z-header)] h-14 border-b border-border bg-card/80 px-4 flex items-center gap-3">
        <div className="h-7 w-32 rounded-md bg-muted/60 shimmer-bar" />
        <div className="ml-auto h-8 w-24 rounded-lg bg-muted/40 shimmer-bar hidden md:block" />
      </div>

      {/* Main content — mirrors page.tsx: max-w-7xl pt-4 pb-24 md:pb-6 */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 pt-4 pb-24 md:pb-6 space-y-4 md:space-y-6">

        {/* Location banner skeleton */}
        <div className="h-11 w-full rounded-xl bg-muted/40 shimmer-bar" />

        {/* HeroCard skeleton */}
        <div className="rounded-xl border border-foreground/8 bg-card ring-1 ring-primary/20 overflow-hidden">
          <div className="p-3 sm:p-5 space-y-3">
            <div className="flex gap-4 items-start">
              <div className="space-y-2">
                <div className="h-12 w-28 rounded-md bg-primary/20 shimmer-bar" />
                <div className="h-4 w-16 rounded bg-muted/40 shimmer-bar" />
              </div>
              <div className="hidden md:block w-px h-16 bg-foreground/10 mx-2" />
              <div className="flex-1 space-y-2 mt-1">
                <div className="h-5 w-44 rounded bg-muted/60 shimmer-bar" />
                <div className="h-4 w-32 rounded bg-muted/40 shimmer-bar" />
                <div className="h-5 w-20 rounded-full bg-muted/30 shimmer-bar" />
              </div>
              <div className="h-10 w-24 rounded-lg bg-primary/10 shimmer-bar ml-auto mt-1 hidden md:block" />
            </div>
            <div className="pt-2 border-t border-foreground/10 flex justify-between">
              <div className="h-3.5 w-28 rounded bg-muted/30 shimmer-bar" />
              <div className="h-8 w-28 rounded-lg bg-muted/40 shimmer-bar" />
            </div>
          </div>
        </div>

        {/* Filter pills skeleton */}
        <div className="flex items-center gap-2 overflow-hidden">
          {[80, 90, 100, 90, 82].map((w, i) => (
            <div
              key={i}
              className="h-11 rounded-full bg-muted/40 shrink-0 shimmer-bar"
              style={{ width: `${w}px` }}
            />
          ))}
          <div className="h-11 w-20 rounded-full bg-muted/30 shimmer-bar shrink-0" />
        </div>

        {/* Price list — 2-col grid matching PriceList sm:grid-cols-2 gap-3 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/8 ps-5 pe-4 py-4 space-y-3"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-8 w-20 bg-primary/20 shimmer-bar rounded-md" />
                  <div className="h-4 w-36 bg-muted/60 shimmer-bar rounded-md" />
                </div>
                <div className="flex gap-1 shrink-0">
                  <div className="h-9 w-9 rounded-md bg-muted/40 shimmer-bar" />
                  <div className="h-9 w-9 rounded-md bg-muted/30 shimmer-bar" />
                </div>
              </div>
              <div className="flex justify-between items-center pt-2.5 border-t border-border/50">
                <div className="flex gap-1.5">
                  <div className="h-5 w-14 rounded-full bg-muted/50 shimmer-bar" />
                  <div className="h-5 w-16 rounded-full bg-muted/40 shimmer-bar" />
                </div>
                <div className="h-3.5 w-16 bg-muted/30 shimmer-bar rounded-md" />
              </div>
            </div>
          ))}
        </div>

        {/* Map skeleton */}
        <div className="h-[400px] w-full rounded-lg bg-muted shimmer-bar" />
      </div>
    </div>
  )
}
