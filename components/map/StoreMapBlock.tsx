'use client'

import dynamic from 'next/dynamic'
import type { Store } from '@/lib/types'

const StoreMap = dynamic(() => import('./StoreMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full rounded-lg bg-muted animate-pulse" />
  ),
})

interface StoreMapBlockProps {
  stores: Store[]
  userLocation?: { lat: number; lng: number } | null
  highlightedStoreId?: string | null
  onMarkerClick?: (storeId: string) => void
  selectedStore?: Store | null
  selectedStorePrice?: number
  isSelectedCheapest?: boolean
  onReportPrice?: (storeId: string) => void
  onClose?: () => void
  lat: number
  lng: number
  cheapestStoreId?: string | null
}

export function StoreMapBlock({
  stores,
  userLocation,
  highlightedStoreId,
  onMarkerClick,
  cheapestStoreId,
}: StoreMapBlockProps) {
  return (
    <div style={{ height: '400px', width: '100%' }}>
      <StoreMap
        stores={stores}
        userLocation={userLocation}
        highlightedStoreId={highlightedStoreId}
        onMarkerClick={onMarkerClick}
        cheapestStoreId={cheapestStoreId}
      />
    </div>
  )
}
