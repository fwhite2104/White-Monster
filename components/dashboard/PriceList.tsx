'use client'

import { PriceCard } from './PriceCard'
import type { Price } from '@/lib/types'

interface PriceListProps {
  prices: Price[]
  userLat?: number
  userLng?: number
  highlightedStoreId?: string | null
  onStoreHover?: (storeId: string | null) => void
}

export function PriceList({
  prices,
  userLat,
  userLng,
  highlightedStoreId,
  onStoreHover,
}: PriceListProps) {
  if (prices.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No prices found in this area.</p>
        <p className="text-sm mt-1">Try increasing the radius or reporting a price.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {prices.map((price, index) => (
        <PriceCard
          key={price.id}
          price={price}
          isCheapest={index === 0}
          userLat={userLat}
          userLng={userLng}
          onHover={() => onStoreHover?.(price.store_id)}
        />
      ))}
    </div>
  )
}
