export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-[var(--z-header)] h-14 border-b border-border bg-card/80 px-4 flex items-center gap-3">
        <div className="h-7 w-32 rounded-md bg-muted/60 shimmer-bar" />
      </div>
      <div className="max-w-7xl mx-auto px-4 pt-4 space-y-3 pb-24">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl card-shadow-sm bg-card shimmer-bar" />
        ))}
      </div>
    </div>
  )
}
