'use client'

import dynamic from 'next/dynamic'
import type { Store } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

const MapLibreMapAsync = dynamic(
  () => import('./MapLibreMap').then((m) => ({ default: m.default })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full rounded-lg" />,
  }
)

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

export function StoreMapBlock(props: StoreMapBlockProps) {
  return (
    <div
      style={{ height: '400px', width: '100%' }}
      className="rounded-xl overflow-hidden border border-white/10 backdrop-blur-xl bg-white/5"
    >
      <MapLibreMapAsync
        stores={props.stores}
        userLocation={props.userLocation}
        selectedStoreId={props.highlightedStoreId}
        cheapestStoreId={props.cheapestStoreId}
        onMarkerClick={props.onMarkerClick}
        className="h-full w-full"
      />
    </div>
  )
}
