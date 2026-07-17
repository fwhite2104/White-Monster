'use client'

import { PriceCard } from '@/components/app/PriceCard'
import { NationalPriceCard } from '@/components/app/NationalPriceCard'
import type { Price } from '@/lib/types'
import type { NationalSummary } from '@/lib/prices'
import { createNationalPriceFromSummary } from '@/lib/prices'

interface PriceListProps {
  prices: Price[]
  nationalSummaries?: NationalSummary[]
  loading: boolean
  error: string | null
  bestPrice: Price | null
  onSelectPrice: (price: Price) => void
  onRetry: () => void
}

export function PriceList({ prices, nationalSummaries = [], loading, error, bestPrice, onSelectPrice, onRetry }: PriceListProps) {
  if (loading) {
    return (
      <div className="space-y-3 pb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl card-shadow-sm bg-card shimmer-bar"
            aria-hidden="true"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium"
        >
          Try again
        </button>
      </div>
    )
  }

  // Determine which retailers are covered by national summaries
  const nationalRetailers = new Set(nationalSummaries.map((s) => s.retailer))

  if (prices.length === 0 && nationalSummaries.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No prices found in this area.</p>
        <p className="text-sm text-muted-foreground mt-1">Try expanding your search radius.</p>
      </div>
    )
  }

  // Find the best price among all items (including summaries) for the "Best Price" badge
  const lowestSummaryPrice = nationalSummaries.length > 0
    ? Math.min(...nationalSummaries.map((s) => Number(s.price)))
    : Infinity
  const lowestPriceOverall = prices.length > 0
    ? Math.min(...prices.map((p) => Number(p.price)), lowestSummaryPrice)
    : lowestSummaryPrice

  return (
    <div className="space-y-3 pb-4">
      {nationalSummaries.map((summary) => (
        <NationalPriceCard
          key={summary.retailer}
          summary={summary}
          isBest={Number(summary.price) === lowestPriceOverall}
          onClick={() => onSelectPrice(createNationalPriceFromSummary(summary))}
        />
      ))}
      {prices
        .filter((p) => !nationalRetailers.has(p.stores?.retailer ?? ''))
        .map((price) => (
          <PriceCard
            key={price.id}
            price={price}
            isBest={bestPrice?.id === price.id || Number(price.price) === lowestPriceOverall}
            onClick={() => onSelectPrice(price)}
          />
        ))}
    </div>
  )
}
