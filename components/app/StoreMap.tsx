'use client'

import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Price } from '@/lib/types'
import { getRetailerColor } from '@/lib/constants'
import 'leaflet/dist/leaflet.css'

interface StoreMapProps {
  prices: Price[]
  userLat: number
  userLng: number
  radiusKm: number
}

/** Default Leaflet marker icons are broken in bundlers — build our own. */
const iconBase = L.divIcon({
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

function StoreMarker({ price }: { price: Price }) {
  const store = price.stores
  if (!store || !Number.isFinite(store.lat) || !Number.isFinite(store.lng)) return null

  const color = getRetailerColor(store.retailer)
  const icon = L.divIcon({
    ...iconBase,
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.8);box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
  })

  return (
    <Marker position={[store.lat, store.lng]} icon={icon}>
      <Popup>
        <div className="text-sm">
          <p className="font-medium">{store.name}</p>
          <p className="text-muted-foreground text-xs">
            {store.suburb ?? store.address ?? ''}
          </p>
          {price.distance !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">
              {(price.distance / 1000).toFixed(1)} km
            </p>
          )}
        </div>
      </Popup>
    </Marker>
  )
}

/** Recenters the map when the user location changes. */
function MapController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], map.getZoom())
  }, [lat, lng, map])
  return null
}

export function StoreMap({ prices, userLat, userLng, radiusKm }: StoreMapProps) {
  // Deduplicate stores by id — keep the first price entry per store for its distance.
  const storeMarkers = useMemo(() => {
    const seen = new Set<string>()
    return prices.filter((p) => {
      const id = p.stores?.id
      if (!id || seen.has(id)) return false
      seen.add(id)
      return true
    })
  }, [prices])

  const hasStores = storeMarkers.length > 0

  return (
    <div className="w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden border border-border">
      <MapContainer
        center={[userLat, userLng]}
        zoom={13}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController lat={userLat} lng={userLng} />

        {/* Radius circle */}
        <Circle
          center={[userLat, userLng]}
          radius={radiusKm * 1000}
          pathOptions={{
            color: 'oklch(0.72 0.22 145)',
            fillColor: 'oklch(0.72 0.22 145)',
            fillOpacity: 0.08,
            weight: 2,
            opacity: 0.4,
          }}
        />

        {/* Store markers */}
        {hasStores && storeMarkers.map((price) => (
          <StoreMarker key={price.stores!.id} price={price} />
        ))}

        {/* Fallback: show center marker even when no stores */}
        {!hasStores && (
          <Marker position={[userLat, userLng]} icon={iconBase}>
            <Popup>Your location</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
