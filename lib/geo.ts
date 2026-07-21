import { getDistance } from 'geolib'

export function isValidCoordinate(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng)
    && lat >= -90 && lat <= 90
    && lng >= -180 && lng <= 180
}

export const REPUBLIC_BBOX = { minLat: 51.3, maxLat: 55.3, minLng: -10.6, maxLng: -6.0 } as const

export function isInRepublicBbox(lat: number, lng: number): boolean {
  return lat >= REPUBLIC_BBOX.minLat && lat <= REPUBLIC_BBOX.maxLat
    && lng >= REPUBLIC_BBOX.minLng && lng <= REPUBLIC_BBOX.maxLng
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
