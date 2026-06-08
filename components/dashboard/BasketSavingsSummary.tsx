'use client'

import { Badge } from '@/components/ui/badge'
import { TrendingDown } from 'lucide-react'

interface BasketSavingsSummaryProps {
  totalCost: number
  totalSavings: number
  worstCaseCost: number
  storesToVisit: number
  recommendation: 'single' | 'multi'
}

export function BasketSavingsSummary({
  totalCost,
  totalSavings,
  worstCaseCost,
  storesToVisit,
  recommendation,
}: BasketSavingsSummaryProps) {
  const hasSavings = totalSavings > 0

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-card ring-1 ring-foreground/10">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tabular-nums">€{totalCost.toFixed(2)}</span>
          {hasSavings && (
            <Badge variant="success" className="text-[10px] px-1.5 py-0 gap-0.5">
              {totalSavings > 0 && <TrendingDown className="h-2.5 w-2.5" />}
              Save €{totalSavings.toFixed(2)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{storesToVisit} store{storesToVisit !== 1 ? 's' : ''}</span>
          {recommendation === 'multi' && (
            <Badge variant="outline" className="text-[9px] h-4 border-foreground/15">
              Multi-store
            </Badge>
          )}
          {worstCaseCost > 0 && (
            <span className="line-through">€{worstCaseCost.toFixed(2)}</span>
          )}
        </div>
      </div>
    </div>
  )
}
