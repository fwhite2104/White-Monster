'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CORK_CENTER, RETAILERS } from '@/lib/constants'

interface IconDefaultProto {
  _getIconUrl?: () => string
}
delete (L.Icon.Default.prototype as IconDefaultProto)._getIconUrl
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

function createColoredIcon(color: string, highlighted: boolean = false): L.Icon {
  const colorMap: Record<string, string> = {
    '#EE1C2E': 'red',
    '#F47920': 'orange',
    '#006633': 'green',
    '#0050AA': 'blue',
    '#00247D': 'blue',
    '#F26522': 'orange',
    '#E31837': 'red',
    '#E60000': 'red',
    '#0055A4': 'blue',
    '#009639': 'green',
    '#6B7280': 'grey',
  }

  const leafletColor = colorMap[color] ?? 'grey'
  const suffix = highlighted ? '-gold' : `-${leafletColor}`

  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x${suffix}.png`,
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })
}

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
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

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

      {stores.map((store) => {
        const retailerColor = getRetailerColor(store.retailer)
        const isHighlighted = highlightedStoreId === store.id
        const icon = isHighlighted
          ? createColoredIcon(retailerColor, true)
          : createColoredIcon(retailerColor)

        return (
          <Marker key={store.id} position={[store.lat, store.lng]} icon={icon}>
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
        )
      })}
    </MapContainer>
  )
}
