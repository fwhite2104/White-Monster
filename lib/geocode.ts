import type { GeocodeResult } from './map-types'

interface NominatimItem {
  lat: string
  lon: string
  display_name: string
  type: string
  category?: string
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const UA = 'monster-ireland/0.1'

export function parseGeocodeResponse(data: NominatimItem[] | null | undefined): GeocodeResult[] {
  if (!data) return []
  return data.map((r) => ({
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    displayName: r.display_name,
    type: r.type ?? r.category ?? '',
  }))
}

export async function geocode(query: string): Promise<GeocodeResult[]> {
  const url = NOMINATIM_URL + '?' + new URLSearchParams({
    q: query,
    format: 'json',
    limit: '6',
    'accept-language': 'en',
  })
  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
  })
  if (!res.ok) throw new Error(`Nominatim error ${res.status}`)
  return parseGeocodeResponse(await res.json())
}
