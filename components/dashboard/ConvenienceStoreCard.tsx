'use client'

import { MapPin, Clock, Tag } from 'lucide-react'
import { getStoreTypeLabel } from '@/lib/convenience-stores'
import type { Store } from '@/lib/types'
import { formatDistance } from '@/lib/geo'

interface ConvenienceStoreCardProps {
  store: Store & { distance: number }
  onReportPrice?: (store: Store) => void
}

export function ConvenienceStoreCard({ store, onReportPrice }: ConvenienceStoreCardProps) {
  const storeType = (store as Store & { store_type?: string }).store_type ?? 'supermarket'
  const isConvenience = storeType === 'convenience' || storeType === 'petrol_station'

  return (
    <div className="rounded-xl bg-card ring-1 ring-border p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium truncate">{store.name}</h3>
            {isConvenience && (
              <span className="inline-flex items-center h-5 px-2 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20 shrink-0">
                {getStoreTypeLabel(store)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{store.address ?? store.retailer}</span>
            {store.suburb && <span>· {store.suburb}</span>}
          </div>

          {store.distance != null && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 shrink-0" />
              <span>{formatDistance(store.distance)}</span>
            </div>
          )}
        </div>

        {isConvenience && onReportPrice && (
          <button
            type="button"
            onClick={() => onReportPrice(store)}
            className="shrink-0 inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
          >
            <Tag className="h-3 w-3" />
            Report Price
          </button>
        )}
      </div>
    </div>
  )
}
