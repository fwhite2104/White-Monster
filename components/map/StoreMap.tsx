'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CORK_CENTER } from '@/lib/constants'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

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
}

function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center)
  }, [center, map])
  return null
}

export default function StoreMap({ stores, userLocation, highlightedStoreId }: StoreMapProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="h-[400px] w-full bg-muted animate-pulse rounded-lg" />
  }

  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [CORK_CENTER.lat, CORK_CENTER.lng]

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={true}
      className="h-[400px] w-full rounded-lg z-0"
    >
      <MapCenter center={center} />
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

      {stores.map((store) => (
        <Marker
          key={store.id}
          position={[store.lat, store.lng]}
          icon={
            highlightedStoreId === store.id
              ? new L.Icon({
                  iconUrl:
                    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
                  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41],
                })
              : new L.Icon.Default()
          }
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{store.name}</p>
              <p className="text-muted-foreground text-xs">{store.retailer}</p>
              {store.address && <p className="text-muted-foreground text-xs">{store.address}</p>}
              {store.distance != null && (
                <p className="text-xs mt-1">{(store.distance / 1000).toFixed(1)} km away</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
