"use client"

import { TrendingDown } from "lucide-react"
import type { Price } from "@/lib/types"

interface BestDealBannerProps {
  bestPrice: Price | null
  nextBestPrice?: Price | null
}

export function BestDealBanner({ bestPrice, nextBestPrice }: BestDealBannerProps) {
  if (!bestPrice) return null

  const savings = nextBestPrice ? Number(nextBestPrice.price) - Number(bestPrice.price) : 0

  return (
    <div className="mx-4 mb-2 flex items-center gap-3 p-3 rounded-lg border border-primary/20 bg-primary/10">
      <TrendingDown className="size-5 text-primary shrink-0" />
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span className="text-sm text-muted-foreground">Best deal:</span>
        <span className="font-bold text-primary">
          €{Number(bestPrice.price).toFixed(2)}
        </span>
        <span className="text-sm text-muted-foreground truncate">
          at {bestPrice.stores?.name ?? "Unknown"}
        </span>
      </div>
      {savings > 0 && (
        <span className="ml-auto text-sm text-muted-foreground shrink-0">
          Save €{savings.toFixed(2)}
        </span>
      )}
    </div>
  )
}
