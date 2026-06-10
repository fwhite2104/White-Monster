import { getDistance, isPointWithinRadius, orderByDistance } from 'geolib'

/**
 * Validate that lat/lng are finite numbers within valid geographic ranges.
 * Returns true if the coordinate can be safely used with Leaflet.
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng)
    && lat >= -90 && lat <= 90
    && lng >= -180 && lng <= 180
}

/**
 * Validate lat/lng and return a sanitized coordinate (with optional fallback).
 * If the coordinate is invalid, returns the fallback if provided, otherwise throws.
 * Never returns NaN or infinite values.
 */
export function validateCoordinate(
  lat: unknown,
  lng: unknown,
  fallback?: { lat: number; lng: number },
): { lat: number; lng: number } {
  const numLat = lat == null || (typeof lat === 'number' && !Number.isFinite(lat)) ? NaN : Number(lat)
  const numLng = lng == null || (typeof lng === 'number' && !Number.isFinite(lng)) ? NaN : Number(lng)
  if (isValidCoordinate(numLat, numLng)) {
    return { lat: numLat, lng: numLng }
  }
  if (fallback && isValidCoordinate(fallback.lat, fallback.lng)) {
    return { lat: fallback.lat, lng: fallback.lng }
  }
  throw new Error(`Invalid coordinates: lat=${lat}, lng=${lng}`)
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

export type FreshnessStatus = 'fresh' | 'yesterday' | 'stale'

/**
 * Returns a freshness label + status based on how old a price's scraped_at timestamp is.
 *  < 24h  → "Updated today"     (fresh)
 * 24–48h  → "Updated yesterday" (yesterday)
 *  > 48h  → "Data may be stale" (stale)
 */
export function getFreshnessLabel(scrapedAt: string | null | undefined): {
  label: string
  status: FreshnessStatus
} {
  if (!scrapedAt) return { label: 'Last updated unknown', status: 'stale' }
  const diff = Date.now() - new Date(scrapedAt).getTime()
  const hours = diff / (1000 * 60 * 60)
  if (hours < 24) return { label: 'Updated today', status: 'fresh' }
  if (hours < 48) return { label: 'Updated yesterday', status: 'yesterday' }
  return { label: 'Data may be stale', status: 'stale' }
}
