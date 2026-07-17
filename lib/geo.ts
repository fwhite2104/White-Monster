import { getDistance, isPointWithinRadius } from 'geolib'

/**
 * Validate that lat/lng are finite numbers within valid geographic ranges.
 * Returns true if the coordinate can be safely used with Leaflet.
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng)
    && lat >= -90 && lat <= 90
    && lng >= -180 && lng <= 180
}

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


