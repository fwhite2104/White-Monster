import { PriceCard } from "./PriceCard"
import type { Price } from "@/lib/types"

interface PriceListProps {
  prices: Price[]
  loading: boolean
  error: string | null
  bestPrice: Price | null
  onSelectPrice: (price: Price) => void
  onRetry: () => void
}

export function PriceList({ prices, loading, error, bestPrice, onSelectPrice, onRetry }: PriceListProps) {
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

  if (prices.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No prices found in this area.</p>
        <p className="text-sm text-muted-foreground mt-1">Try expanding your search radius.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 pb-4">
      {prices.map((price) => (
        <PriceCard
          key={price.id}
          price={price}
          isBest={bestPrice?.id === price.id}
          onClick={() => onSelectPrice(price)}
        />
      ))}
    </div>
  )
}
