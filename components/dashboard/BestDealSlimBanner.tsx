'use client'

import { TrendingDown } from 'lucide-react'
import type { Price } from '@/lib/types'

interface BestDealSlimBannerProps {
  bestPrice: Price
  nextBestPrice?: Price | null
}

export function BestDealSlimBanner({ bestPrice, nextBestPrice }: BestDealSlimBannerProps) {
  const storeName = bestPrice.stores?.name ?? 'Unknown Store'
  const savings = nextBestPrice
    ? Number(nextBestPrice.price) - Number(bestPrice.price)
    : null

  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2.5 min-h-12">
      <TrendingDown className="h-4 w-4 shrink-0 text-primary" />
      <p className="text-sm truncate">
        <span className="font-semibold tabular-nums text-primary">
          €{Number(bestPrice.price).toFixed(2)}
        </span>
        <span className="text-muted-foreground"> at </span>
        <span className="font-medium text-foreground">{storeName}</span>
        {savings !== null && savings > 0 && (
          <>
            <span className="text-muted-foreground"> — save </span>
            <span className="font-semibold tabular-nums text-primary">
              €{savings.toFixed(2)}
            </span>
            <span className="text-muted-foreground"> vs next cheapest</span>
          </>
        )}
      </p>
    </div>
  )
}
