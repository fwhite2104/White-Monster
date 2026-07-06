"use client"

import { MapPin, RefreshCw } from "lucide-react"
import type { Price } from "@/lib/types"
import { PriceCard } from "./PriceCard"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

interface PriceListProps {
  prices: Price[]
  loading: boolean
  error: string | null
  bestPrice: Price | null
  onSelectPrice: (price: Price) => void
  onRetry?: () => void
}

export function PriceList({ prices, loading, error, bestPrice, onSelectPrice, onRetry }: PriceListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3 px-4 pb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-12">
        <MapPin className="size-12 text-muted-foreground" />
        <p className="text-muted-foreground">{error}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="size-4 mr-2" />
            Try again
          </Button>
        )}
      </div>
    )
  }

  if (prices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-12">
        <MapPin className="size-12 text-muted-foreground" />
        <p className="text-center text-muted-foreground">
          No prices found in this area.
          <br />
          Try widening your radius.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      {prices.map((price) => (
        <PriceCard
          key={price.id}
          price={price}
          isBestDeal={bestPrice?.id === price.id}
          onClick={() => onSelectPrice(price)}
        />
      ))}
    </div>
  )
}
