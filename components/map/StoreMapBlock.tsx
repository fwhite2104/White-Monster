'use client'

import dynamic from 'next/dynamic'
import { MapPin } from 'lucide-react'
import { MapInfoCard } from '@/components/map/MapInfoCard'
import { MapErrorBoundary } from '@/components/shared/MapErrorBoundary'
import type { Store } from '@/lib/types'

const StoreMap = dynamic(() => import('@/components/map/StoreMap'), {
  ssr: false,
  loading: () => <div className="h-[300px] md:h-[400px] w-full bg-muted animate-pulse rounded-lg" />,
})

interface StoreMapBlockProps {
  stores: Store[]
  userLocation?: { lat: number; lng: number }
  highlightedStoreId: string | null
  onMarkerClick: (storeId: string) => void
  selectedStore: Store | null
  selectedStorePrice: number | undefined
  isSelectedCheapest: boolean
  onMapInfoReportPrice: (storeId: string) => void
  onCloseSelectedStore: () => void
  lat: number
  lng: number
}

export function StoreMapBlock({
  stores,
  userLocation,
  highlightedStoreId,
  onMarkerClick,
  selectedStore,
  selectedStorePrice,
  isSelectedCheapest,
  onMapInfoReportPrice,
  onCloseSelectedStore,
  lat,
  lng,
}: StoreMapBlockProps) {
  return (
    <>
      <div className="relative overflow-hidden rounded-lg" aria-label="Store map">
        <MapErrorBoundary>
          <StoreMap
            stores={stores}
            userLocation={userLocation}
            highlightedStoreId={highlightedStoreId}
            onMarkerClick={onMarkerClick}
          />
        </MapErrorBoundary>
        {selectedStore && (
          <div className="absolute bottom-0 left-0 right-0 z-10">
            <MapInfoCard
              store={selectedStore}
              price={selectedStorePrice}
              isCheapest={isSelectedCheapest}
              onReportPrice={onMapInfoReportPrice}
              onClose={onCloseSelectedStore}
            />
          </div>
        )}
      </div>
      <a
        href={`https://www.google.com/maps?q=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors min-h-[56px]"
        aria-label={`Open map showing location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`}
      >
        <MapPin className="size-5 shrink-0 text-primary" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Open in Maps</p>
          <p className="text-xs text-muted-foreground truncate">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </p>
        </div>
        <svg
          className="size-4 shrink-0 text-muted-foreground"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    </>
  )
}
