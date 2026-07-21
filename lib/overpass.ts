import type { Place } from './map-types'

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
  nodes?: number[]
  members?: unknown[]
}

// ---------------------------------------------------------------------------
// Overpass endpoints, tried in order
// ---------------------------------------------------------------------------

const OVERPASS_URLS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]

const UA = 'monster-ireland/0.1'

// ---------------------------------------------------------------------------
// Query builder
// ---------------------------------------------------------------------------

export function buildQuery(
  lat: number,
  lng: number,
  radius: number,
  tagFilter: string,
  search?: string,
): string {
  const center = `(around:${radius},${lat},${lng})`

  if (search && search.trim()) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return [
      '[out:json][timeout:15];',
      '(',
      `  node[~"^(name|brand)$"~"${escaped}",i]${center};`,
      `  way[~"^(name|brand)$"~"${escaped}",i]${center};`,
      ');',
      'out center tags 50;',
    ].join('\n')
  }

  return [
    '[out:json][timeout:15];',
    '(',
    `  node${tagFilter}${center};`,
    `  way${tagFilter}${center};`,
    ');',
    'out center tags 80;',
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Response parser
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseOverpassResponse(data: any): Place[] {
  if (!data?.elements) return []

  const places: Place[] = []

  for (const el of data.elements) {
    if (!el.tags) continue

    const name = el.tags.name || el.tags.brand || el.tags.operator || ''
    if (!name) continue

    const c = el.center
    const lat = el.lat ?? (c ? (c as Record<string, number>).lat : undefined)
    const lng = el.lon ?? (c ? (c as Record<string, number>).lon : undefined)
    if (lat == null || lng == null) continue

    const tagKey = el.tags.shop ? 'shop' : el.tags.amenity ? 'amenity' : el.tags.leisure ? 'leisure' : 'other'
    const tagValue = el.tags.shop || el.tags.amenity || el.tags.leisure || 'unknown'

    const addrParts = [el.tags['addr:housenumber'], el.tags['addr:street'], el.tags['addr:city']].filter(Boolean)

    places.push({
      id: `${el.type}/${el.id}`,
      name,
      lat,
      lng,
      category: tagKey,
      subcategory: tagValue,
      address: addrParts.join(' ') || undefined,
      phone: el.tags.phone || undefined,
    })
  }

  const seen = new Set<string>()
  return places.filter((p) => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
}

// ---------------------------------------------------------------------------
// Fetch wrapper with automatic endpoint fallback
// ---------------------------------------------------------------------------

async function postOverpass(query: string): Promise<Place[]> {
  const body = `data=${encodeURIComponent(query)}`

  for (const url of OVERPASS_URLS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
        body,
      })
      if (res.status === 429 || res.status === 504 || res.status >= 500) continue
      if (!res.ok) continue
      return parseOverpassResponse(await res.json())
    } catch (err) {
      if (err instanceof TypeError && url === OVERPASS_URLS[OVERPASS_URLS.length - 1]) throw err
      if (err instanceof TypeError) continue
      throw err
    }
  }

  throw new Error('All Overpass endpoints failed')
}

export async function queryOverpass(
  lat: number,
  lng: number,
  tagFilter: string,
  search?: string,
): Promise<Place[]> {
  return postOverpass(buildQuery(lat, lng, 1500, tagFilter, search))
}

/**
 * Query Overpass for OSM nodes/ways matching a brand name as `name` or `brand` tag.
 * Useful for finding physical store locations of a retailer (Tesco, Lidl, etc.)
 * within `radius` meters of a coordinate.
 *
 * The caller should run multiple brand queries in parallel via `Promise.all`,
 * then merge/flatten results and deduplicate by `Place.id`.
 */
export async function queryBrandStores(
  brandName: string,
  lat: number,
  lng: number,
  radius: number,
): Promise<Place[]> {
  return postOverpass(buildQuery(lat, lng, radius, '', brandName))
}
