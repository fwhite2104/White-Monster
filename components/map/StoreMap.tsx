'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CORK_CENTER, RETAILERS } from '@/lib/constants'
import { cn } from '@/lib/utils'

const BRAND_GREEN = 'oklch(0.72 0.22 145)'
const MUTED_GRAY = 'oklch(0.55 0 0)'
function createDivIcon(html: string, size: [number, number], anchor: [number, number]): L.DivIcon {
  return L.divIcon({
    html,
    className: '',
    iconSize: size,
    iconAnchor: anchor,
    popupAnchor: [0, -size[1] / 2 - 4],
  })
}

const userIcon = createDivIcon(
  `<div style="width:14px;height:14px;border-radius:50%;background:${BRAND_GREEN};border:2.5px solid white;box-shadow:0 0 10px ${BRAND_GREEN} / 0.5;"></div>`,
  [14, 14],
  [7, 7],
)

const defaultStoreIcon = createDivIcon(
  `<div style="width:16px;height:16px;border-radius:50%;background:${MUTED_GRAY};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>`,
  [16, 16],
  [8, 8],
)

const cheapestStoreIcon = createDivIcon(
  `<div style="width:20px;height:20px;border-radius:50%;background:${BRAND_GREEN};border:2.5px solid white;box-shadow:0 0 8px ${BRAND_GREEN} / 0.5;"><div style="width:6px;height:6px;border-radius:50%;background:white;margin:5px auto 0;"></div></div>`,
  [20, 20],
  [10, 10],
)

const highlightedStoreIcon = createDivIcon(
  `<div style="width:20px;height:20px;border-radius:50%;background:${BRAND_GREEN};border:2.5px solid white;box-shadow:0 0 8px ${BRAND_GREEN} / 0.5;animation:marker-pulse 2s ease-in-out infinite;"><div style="width:6px;height:6px;border-radius:50%;background:white;margin:5px auto 0;"></div></div>
   <style>@keyframes marker-pulse{0%,100%{box-shadow:0 0 8px ${BRAND_GREEN} / 0.5}50%{box-shadow:0 0 16px ${BRAND_GREEN} / 0.8}}</style>`,
  [20, 20],
  [10, 10],
)

function getRetailerColor(retailer: string): string {
  const found = RETAILERS.find((r) => r.value === retailer.toLowerCase())
  return found?.color ?? '#6B7280'
}

interface Store {
  id: string
  name: string
  retailer: string
  address?: string
  lat: number
  lng: number
  distance?: number
}

interface StoreMapProps {
  stores: Store[]
  userLocation?: { lat: number; lng: number } | null
  highlightedStoreId?: string | null
  onMarkerClick?: (storeId: string) => void
  className?: string
}

function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, map.getZoom(), { duration: 0.8 })
  }, [center, map])
  return null
}

function FitBounds({ stores }: { stores: Store[] }) {
  const map = useMap()
  useEffect(() => {
    if (stores.length === 0) return
    const bounds = L.latLngBounds(stores.map((s) => [s.lat, s.lng] as [number, number]))
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
  }, [stores, map])
  return null
}

export default function StoreMap({ stores, userLocation, highlightedStoreId, onMarkerClick, className }: StoreMapProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMounted(true)
    }
  }, [])

  if (!mounted) {
    return (
      <div
        className={cn(
          'h-[400px] w-full rounded-lg shimmer-bar',
          'bg-muted',
          className,
        )}
      />
    )
  }

  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [CORK_CENTER.lat, CORK_CENTER.lng]

  return (
    <div className={cn('relative', className)}>
      {!userLocation && stores.length > 0 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 backdrop-blur-sm pointer-events-none whitespace-nowrap">
          Location access denied — showing default map view
        </div>
      )}
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="h-[400px] w-full rounded-lg z-0"
      >
        <MapCenter center={center} />
        <FitBounds stores={stores} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="text-sm font-semibold">You are here</div>
            </Popup>
          </Marker>
        )}

        {stores.map((store) => {
          const isHighlighted = highlightedStoreId === store.id
          const isCheapest = false
          const icon = isHighlighted
            ? highlightedStoreIcon
            : isCheapest
              ? cheapestStoreIcon
              : defaultStoreIcon

          return (
            <Marker
              key={store.id}
              position={[store.lat, store.lng]}
              icon={icon}
              eventHandlers={
                onMarkerClick
                  ? { click: () => onMarkerClick(store.id) }
                  : undefined
              }
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{store.name}</p>
                  <p
                    className="text-xs"
                    style={{ color: getRetailerColor(store.retailer) }}
                  >
                    {store.retailer}
                  </p>
                  {store.address && <p className="text-muted-foreground text-xs">{store.address}</p>}
                  {store.distance != null && (
                    <p className="text-xs mt-1">{(store.distance / 1000).toFixed(1)} km away</p>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
