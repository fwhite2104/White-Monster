import { Zap } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
        <Zap className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">
          Monster <span className="text-primary">Cork</span>
        </h1>
        <span className="text-xs text-muted-foreground ml-auto hidden sm:inline">
          Cheapest White Monster in Cork
        </span>
      </div>
    </header>
  )
}
