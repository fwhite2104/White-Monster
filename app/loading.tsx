export default function Loading() {
  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 space-y-6">
        <div className="h-10 w-full bg-muted animate-pulse rounded-lg" />
        <div className="h-[400px] w-full bg-muted animate-pulse rounded-lg" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/8 p-4 space-y-3"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-32 bg-muted/60 shimmer-bar rounded-md" />
                  <div className="h-3.5 w-24 bg-muted/40 shimmer-bar rounded-md" />
                </div>
                <div className="space-y-2 text-right shrink-0">
                  <div className="h-7 w-20 bg-primary/20 shimmer-bar rounded-md" />
                  <div className="h-5 w-16 rounded-full bg-muted/40 shimmer-bar" />
                </div>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-border/50">
                <div className="h-5 w-16 rounded-full bg-muted/60 shimmer-bar" />
                <div className="h-3 w-28 bg-muted/30 shimmer-bar rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
