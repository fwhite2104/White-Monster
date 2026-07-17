'use client'

import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import type { Price } from '@/lib/types'
import { getRetailerColor } from '@/lib/constants'
import 'leaflet/dist/leaflet.css'

interface StoreMapProps {
  prices: Price[]
  userLat: number
  userLng: number
  radiusKm: number
  userAccuracy?: number
}

const PRIMARY = 'oklch(0.72 0.22 145)'

const pulseKeyframes = `
@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.5); opacity: 0.2; }
  100% { transform: scale(1); opacity: 0.5; }
}
@keyframes pulse-dot {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
`

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

const userIcon = L.divIcon({
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  html: `<div style="position:relative;width:28px;height:28px">
    <div style="position:absolute;inset:0;border-radius:50%;border:3px solid ${PRIMARY};animation:pulse-ring 2s ease-in-out infinite"></div>
    <div style="position:absolute;top:4px;left:4px;width:20px;height:20px;border-radius:50%;background:${PRIMARY};border:3px solid rgba(255,255,255,0.9);box-shadow:0 1px 4px rgba(0,0,0,0.3);animation:pulse-dot 2s ease-in-out infinite"></div>
  </div>`,
})

function storeIcon(retailer: string): L.DivIcon {
  const color = getRetailerColor(retailer)
  const letter = retailer.charAt(0).toUpperCase()
  return L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.9);box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;line-height:1;font-family:system-ui,-apple-system,sans-serif">${letter}</div>`,
  })
}

function createClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount()
  const size = count < 10 ? 36 : count < 100 ? 44 : 52
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${PRIMARY};border:3px solid rgba(255,255,255,0.8);box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:${size < 44 ? 13 : 15}px;font-weight:700;color:#fff;line-height:1;font-family:system-ui,-apple-system,sans-serif">${count}</div>`,
  })
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StoreMarker({ price }: { price: Price }) {
  const store = price.stores
  if (!store || !Number.isFinite(Number(store.lat)) || !Number.isFinite(Number(store.lng))) return null

  const icon = storeIcon(store.retailer)
  const storeTypeLabel =
    store.store_type
      ? ({ supermarket: 'Supermarket', convenience: 'Convenience Store', petrol_station: 'Petrol Station', other: 'Other' } as const)[store.store_type]
      : null

  return (
    <Marker position={[Number(store.lat), Number(store.lng)]} icon={icon}>
      <Popup>
        <div className="text-sm space-y-1.5 min-w-[180px]">
          <p className="font-semibold text-sm">{store.name}</p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: getRetailerColor(store.retailer) }} />
            <span>{store.retailer.charAt(0).toUpperCase() + store.retailer.slice(1)}</span>
            {storeTypeLabel && <><span>·</span><span>{storeTypeLabel}</span></>}
          </div>
          <p className="text-xs text-muted-foreground">
            {store.suburb ?? store.address ?? ''}
          </p>
          {price.distance !== undefined && (
            <p className="text-xs text-muted-foreground">
              {(Number(price.distance) / 1000).toFixed(1)} km away
            </p>
          )}
          {price.per_can_price !== undefined && price.per_can_price > 0 && (
            <p className="text-xs text-muted-foreground">
              €{Number(price.per_can_price).toFixed(2)} per can
            </p>
          )}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs font-medium text-primary hover:underline mt-1"
          >
            Get Directions →
          </a>
        </div>
      </Popup>
    </Marker>
  )
}

function MapController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], map.getZoom())
  }, [lat, lng, map])
  return null
}

const LEGEND_STYLE: React.CSSProperties = {
  position: 'absolute',
  bottom: 16,
  left: 16,
  zIndex: 1000,
  pointerEvents: 'none',
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(4px)',
  borderRadius: 8,
  padding: '6px 10px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

function Legend() {
  return (
    <div style={LEGEND_STYLE}>
      <div className="flex items-center gap-2 text-xs text-white/90">
        <span className="size-2.5 rounded-full shrink-0" style={{ background: PRIMARY, border: '1px solid rgba(255,255,255,0.7)' }} />
        You
      </div>
      <div className="flex items-center gap-2 text-xs text-white/90">
        <span className="size-2.5 rounded-full shrink-0" style={{ background: '#94a3b8', border: '1px solid rgba(255,255,255,0.5)' }} />
        Store
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function StoreMap({ prices, userLat, userLng, radiusKm, userAccuracy }: StoreMapProps) {
  const storeMarkers = useMemo(() => {
    const seen = new Set<string>()
    return prices.filter((p) => {
      const id = p.stores?.id
      if (!id || seen.has(id)) return false
      seen.add(id)
      return true
    })
  }, [prices])

  return (
    <div className="relative w-full min-h-[360px] md:min-h-[480px] h-[360px] md:h-[480px] rounded-xl overflow-hidden border border-border">
      <style>{pulseKeyframes}</style>

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

        {/* User location marker */}
        <Marker position={[userLat, userLng]} icon={userIcon}>
          <Popup>Your location</Popup>
        </Marker>

        {/* GPS accuracy circle */}
        {userAccuracy !== undefined && userAccuracy > 0 && (
          <Circle
            center={[userLat, userLng]}
            radius={userAccuracy}
            pathOptions={{
              color: PRIMARY,
              fillColor: PRIMARY,
              fillOpacity: 0.06,
              weight: 1,
              opacity: 0.3,
              dashArray: '4 4',
            }}
          />
        )}

        {/* Radius circle */}
        <Circle
          center={[userLat, userLng]}
          radius={radiusKm * 1000}
          pathOptions={{
            color: PRIMARY,
            fillColor: PRIMARY,
            fillOpacity: 0.08,
            weight: 2,
            opacity: 0.4,
          }}
        />

        {/* Store markers with clustering */}
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={60}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          iconCreateFunction={createClusterIcon}
        >
          {storeMarkers.map((price) => (
            <StoreMarker key={price.stores!.id} price={price} />
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      <Legend />
    </div>
  )
}
