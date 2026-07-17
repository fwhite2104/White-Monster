import { getDistance } from 'geolib'

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
