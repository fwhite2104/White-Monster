'use client'

import { Info } from 'lucide-react'
import { RetailerBadge } from './RetailerBadge'
import type { NationalSummary } from '@/lib/prices'

interface NationalPriceCardProps {
  summary: NationalSummary
  isBest?: boolean
  /** Card click → highlight nearest store for this retailer on map. */
  onClick?: () => void
  /** 'Details' button → open detail sheet. */
  onViewDetails?: () => void
}

export function NationalPriceCard({ summary, isBest, onClick, onViewDetails }: NationalPriceCardProps) {
  const numericPrice = Number(summary.price)
  const perCan = summary.per_can_price ?? numericPrice
  const retailerLabel = summary.retailer.charAt(0).toUpperCase() + summary.retailer.slice(1)
  const isNationwide = !Number.isFinite(summary.nearest_distance)
  const distanceKm = isNationwide ? null : (summary.nearest_distance / 1000).toFixed(1)

  return (
    <div
      data-testid="national-price-card"
      className="group relative w-full text-left px-4 py-3 rounded-xl card-shadow-sm bg-card hover:bg-card/80 hover:border-primary/20 transition-all cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.() } }}
      aria-label={`${retailerLabel}: €${numericPrice.toFixed(2)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <RetailerBadge retailer={summary.retailer} />
          <h3 className="mt-1 font-medium truncate">{retailerLabel}</h3>
          <p className="text-xs text-muted-foreground">
            {isNationwide ? (
              <span className="text-primary font-medium">Nationwide</span>
            ) : (
              <>{distanceKm} km away</>
            )} · {summary.store_count} {summary.store_count === 1 ? 'store' : 'stores'}
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
      {summary.has_clubcard_pricing && summary.clubcard_price != null && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs">
          <span className="text-primary font-medium">Clubcard:</span>
          <span>€{Number(summary.clubcard_price).toFixed(2)} per can</span>
        </div>
      )}
      {isBest && (
        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
          Best Price
        </div>
      )}
      <div className="mt-2 flex gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onViewDetails?.() }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={`Details for ${retailerLabel}`}
        >
          <Info className="size-3" />
          Details
        </button>
      </div>
    </div>
  )
}
