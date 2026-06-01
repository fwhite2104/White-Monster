import { getDistance, isPointWithinRadius, orderByDistance } from 'geolib'

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  return getDistance(
    { latitude: lat1, longitude: lng1 },
    { latitude: lat2, longitude: lng2 }
  )
}

export function filterByRadius<T extends { lat: number; lng: number }>(
  items: T[],
  centerLat: number,
  centerLng: number,
  radiusKm: number
): T[] {
  return items.filter((item) =>
    isPointWithinRadius(
      { latitude: centerLat, longitude: centerLng },
      { latitude: item.lat, longitude: item.lng },
      radiusKm * 1000
    )
  )
}

export function sortByDistance<T extends { lat: number; lng: number }>(
  items: T[],
  centerLat: number,
  centerLng: number
): T[] {
  return orderByDistance(
    { latitude: centerLat, longitude: centerLng },
    items.map((item) => ({ latitude: item.lat, longitude: item.lng, ...item }))
  ).map((item) => {
    const typedItem = item as Record<string, unknown>
    const { latitude, longitude, ...rest } = typedItem
    return { lat: Number(latitude), lng: Number(longitude), ...rest } as T
  })
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

export function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
