'use client'

import { RetailerBadge } from './RetailerBadge'
import { formatPackSize } from '@/lib/constants'
import type { NationalSummary } from '@/lib/prices'

interface NationalPriceCardProps {
  summary: NationalSummary
  isBest?: boolean
  onClick?: () => void
}

export function NationalPriceCard({ summary, isBest, onClick }: NationalPriceCardProps) {
  const numericPrice = Number(summary.price)
  const perCan = summary.perCanPrice ?? numericPrice
  const retailerLabel = summary.retailer.charAt(0).toUpperCase() + summary.retailer.slice(1)
  const distanceKm = (summary.nearestDistance / 1000).toFixed(1)

  return (
    <button
      onClick={onClick}
      data-testid="national-price-card"
      className="w-full text-left px-4 py-3 rounded-xl card-shadow-sm bg-card hover:bg-card/80 hover:border-primary/20 transition-all"
      aria-label={`${retailerLabel}: €${numericPrice.toFixed(2)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <RetailerBadge retailer={summary.retailer} />
          <h3 className="mt-1 font-medium truncate">{retailerLabel}</h3>
          <p className="text-xs text-muted-foreground">
            {distanceKm} km away · {summary.storeCount} {summary.storeCount === 1 ? 'store' : 'stores'}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="price-lg text-lg font-semibold text-foreground">
            €{numericPrice.toFixed(2)}
          </div>
          {perCan > 0 && perCan !== numericPrice && (
            <div className="text-xs text-muted-foreground">
              €{perCan.toFixed(2)} per can
            </div>
          )}
        </div>
      </div>
      {summary.hasClubcardPricing && summary.clubcardPrice != null && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs">
          <span className="text-primary font-medium">Clubcard:</span>
          <span>€{Number(summary.clubcardPrice).toFixed(2)} per can</span>
        </div>
      )}
      {isBest && (
        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
          Best Price
        </div>
      )}
    </button>
  )
}
