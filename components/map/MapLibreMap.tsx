'use client'

import { useEffect, useState } from 'react'
import Map, { Marker, Popup } from 'react-map-gl/maplibre'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { CORK_CENTER, getRetailerColor } from '@/lib/constants'
import { isValidCoordinate } from '@/lib/geo'
import { cn } from '@/lib/utils'

interface Store {
  id: string
  name: string
  retailer: string
  address?: string
  lat: number
  lng: number
  distance?: number
}

interface MapLibreMapProps {
  stores: Store[]
  userLocation?: { lat: number; lng: number } | null
  selectedStoreId?: string | null
  cheapestStoreId?: string | null
  onMarkerClick?: (storeId: string) => void
  className?: string
}

const MUTED_GRAY = 'oklch(0.55 0 0)'

function UserMarkerIcon() {
  return (
    <div
      style={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: '#57c466',
        border: '2.5px solid white',
        boxShadow: '0 0 10px rgba(87,196,102,0.5)',
      }}
    />
  )
}

function DefaultStoreMarker() {
  return (
    <div
      style={{
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: MUTED_GRAY,
        border: '2px solid white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      }}
    />
  )
}

function CheapestStoreMarker({ highlighted }: { highlighted: boolean }) {
  return (
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: '#57c466',
        border: '2.5px solid white',
        boxShadow: highlighted
          ? '0 0 8px rgba(87,196,102,0.5)'
          : '0 1px 3px rgba(0,0,0,0.4)',
        animation: highlighted ? 'marker-pulse 2s ease-in-out infinite' : undefined,
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'white',
          margin: '5px auto 0',
        }}
      />
      {highlighted && (
        <style>{`
          @keyframes marker-pulse {
            0%, 100% { box-shadow: 0 0 8px rgba(87,196,102,0.5); }
            50% { box-shadow: 0 0 16px rgba(87,196,102,0.8); }
          }
        `}</style>
      )}
    </div>
  )
}

function StorePopupContent({ store }: { store: Store }) {
  const retailerColor = getRetailerColor(store.retailer)
  return (
    <div className="flex overflow-hidden rounded-xl" style={{ minWidth: '160px' }}>
      <div
        className="w-1 shrink-0"
        style={{ backgroundColor: retailerColor }}
      />
      <div className="flex-1 px-3 py-2 text-sm">
        <p className="font-semibold text-foreground">{store.name}</p>
        <p
          className="text-xs font-medium capitalize"
          style={{ color: retailerColor }}
        >
          {store.retailer}
        </p>
        {store.address && (
          <p className="text-muted-foreground text-xs mt-0.5 truncate max-w-[180px]">
            {store.address}
          </p>
        )}
        {store.distance != null && (
          <p className="text-xs text-primary font-medium mt-1 tabular-nums">
            {(store.distance / 1000).toFixed(1)} km away
          </p>
        )}
      </div>
    </div>
  )
}

export default function MapLibreMap({
  stores,
  userLocation,
  selectedStoreId,
  cheapestStoreId,
  onMarkerClick,
  className,
}: MapLibreMapProps) {
  const [mounted, setMounted] = useState(false)
  const [openStoreId, setOpenStoreId] = useState<string | null>(null)
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // fitBounds when stores or userLocation changes
  useEffect(() => {
    if (!mapInstance || stores.length === 0) return

    const validPoints: [number, number][] = []
    stores.forEach((s) => {
      if (isValidCoordinate(s.lat, s.lng)) {
        validPoints.push([s.lng, s.lat])
      }
    })

    if (userLocation && isValidCoordinate(userLocation.lat, userLocation.lng)) {
      validPoints.push([userLocation.lng, userLocation.lat])
    }

    if (validPoints.length === 0) return

    const bounds = validPoints.reduce(
      (acc, point) => acc.extend(point),
      new maplibregl.LngLatBounds(validPoints[0], validPoints[0])
    )

    mapInstance.fitBounds(bounds, { padding: { top: 50, bottom: 50, left: 50, right: 50 }, maxZoom: 15 })
  }, [stores, userLocation, mapInstance])

  // Sync selectedStoreId to openStoreId
  useEffect(() => {
    if (selectedStoreId) {
      setOpenStoreId(selectedStoreId)
    }
  }, [selectedStoreId])

  if (!mounted) {
    return (
      <div
        className={cn(
          'h-[400px] w-full rounded-lg bg-muted shimmer-bar',
          className,
        )}
      />
    )
  }

  const center: [number, number] =
    userLocation && isValidCoordinate(userLocation.lat, userLocation.lng)
      ? [userLocation.lng, userLocation.lat]
      : [CORK_CENTER.lng, CORK_CENTER.lat]

  const validStores = stores.filter((s) => isValidCoordinate(s.lat, s.lng))

  return (
    <div className={cn('relative', className)}>
      {!userLocation && validStores.length > 0 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full text-xs font-medium bg-black/60 text-amber-300 backdrop-blur-sm pointer-events-none whitespace-nowrap">
          Location access denied — showing default map view
        </div>
      )}

      <style>{`
        .maplibregl-popup-content {
          background: rgba(0, 0, 0, 0.6) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          color: var(--foreground) !important;
          border-radius: 0.75rem !important;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          padding: 0 !important;
          overflow: hidden;
        }
        .maplibregl-popup-tip {
          display: none;
        }
      `}</style>

      <Map
        mapLib={maplibregl}
        initialViewState={{
          longitude: center[0],
          latitude: center[1],
          zoom: 13,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attributionControl={false}
        onLoad={(e) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setMapInstance(e.target as unknown as maplibregl.Map)
        }}
      >

        {userLocation && isValidCoordinate(userLocation.lat, userLocation.lng) && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat}>
            <UserMarkerIcon />
          </Marker>
        )}

        {validStores.map((store) => {
          const isOpen = openStoreId === store.id
          const isCheapest = cheapestStoreId === store.id

          return (
            <Marker
              key={store.id}
              longitude={store.lng}
              latitude={store.lat}
              onClick={(e) => {
                e.originalEvent.stopPropagation()
                setOpenStoreId(isOpen ? null : store.id)
                onMarkerClick?.(store.id)
              }}
            >
              {isCheapest ? (
                <CheapestStoreMarker highlighted={isOpen} />
              ) : (
                <DefaultStoreMarker />
              )}

              {isOpen && (
                <Popup
                  longitude={store.lng}
                  latitude={store.lat}
                  anchor="bottom"
                  offset={[-0, -16]}
                  closeButton={false}
                  closeOnClick={false}
                  onClose={() => setOpenStoreId(null)}
                >
                  <StorePopupContent store={store} />
                </Popup>
              )}
            </Marker>
          )
        })}
      </Map>
    </div>
  )
}
