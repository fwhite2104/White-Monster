import { Zap } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-header border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10 text-primary">
          <Zap className="size-5 fill-current" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-lg font-semibold leading-tight">Monster Cork</h1>
          <p className="text-xs text-muted-foreground">Find the cheapest Monster Energy near you</p>
        </div>
      </div>
    </header>
  )
}
