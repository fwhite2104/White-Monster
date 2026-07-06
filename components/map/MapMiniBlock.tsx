'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import type { Store } from '@/lib/types'

const MapLibreMapAsync = dynamic(
  () => import('./MapLibreMap').then(m => ({ default: m.default })),
  {
    ssr: false,
    loading: () => <Skeleton className="w-full rounded-lg" />,
  }
)

interface MapMiniBlockProps {
  store: Store
  userLocation?: { lat: number; lng: number } | null
  height?: number
  className?: string
}

export function MapMiniBlock({ store, userLocation, height = 240, className }: MapMiniBlockProps) {
  return (
    <div className={className} style={{ height: `${height}px` }}>
      <MapLibreMapAsync
        stores={[store]}
        userLocation={userLocation}
        selectedStoreId={store.id}
        className="h-full w-full"
      />
    </div>
  )
}
