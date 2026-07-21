'use client'

import { useState, useEffect, useRef } from 'react'
import { queryBrandsGroup } from '@/lib/overpass'
import type { Place } from '@/lib/map-types'
import { RETAILERS } from '@/lib/constants'
import { calculateDistance } from '@/lib/geo'
import type { StoreMarker } from '@/lib/types'

interface UseOverpassMarkersOptions {
  lat: number
  lng: number
  radiusKm: number
  enabled: boolean
}

interface UseOverpassMarkersReturn {
  markers: StoreMarker[]
  loading: boolean
  error: string | null
}

/**
 * Fetches store locations from OpenStreetMap via Overpass API for all known
 * retailers near the given coordinates. Used as a fallback source of store
 * markers when the prices API has no data or is unavailable.
 *
 * Results are deduplicated by OSM element ID and formatted as StoreMarker[]
 * compatible with StoreMapBlock.
 */
export function useOverpassMarkers({
  lat,
  lng,
  radiusKm,
  enabled,
}: UseOverpassMarkersOptions): UseOverpassMarkersReturn {
  const [markers, setMarkers] = useState<StoreMarker[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    if (!enabled) {
      setMarkers([])
      return
    }

    cancelledRef.current = false
    let didRun = false

    async function fetchAll() {
      setLoading(true)
      setError(null)

      try {
        const radiusMeters = radiusKm * 1000
        const results: StoreMarker[] = []
        const seen = new Set<string>()

        // Query ALL brands in ONE request to avoid Overpass rate limiting
        const brandLabels = RETAILERS.map((r) => r.label)
        // Build a map of OSM id → retailer value so we can match results back
        // First, query all brands at once
        const places = await queryBrandsGroup(brandLabels, lat, lng, radiusMeters)
        const matched = matchBrandsToRetailers(places)

        for (const place of matched) {
          if (seen.has(place.id)) continue
          seen.add(place.id)

          const distance = calculateDistance(lat, lng, place.lat, place.lng)

          results.push({
            id: `osm_${place.id}`,
            retailer: place.retailer,
            name: place.name,
            address: place.address ?? '',
            suburb: '',
            lat: place.lat,
            lng: place.lng,
            distance: Math.round(distance),
            price: 0,
            per_can_price: 0,
            drs_deposit: 0,
            clubcard_price: null,
            has_clubcard_pricing: false,
            pack_size: 'single',
            source_type: 'per_store',
          })
        }

        if (!cancelledRef.current) {
          setMarkers(results)
          didRun = true
        }
      } catch (err) {
        if (!cancelledRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to load store locations')
          didRun = true
        }
      } finally {
        if (!cancelledRef.current) {
          setLoading(false)
        }
      }
    }

    fetchAll()

    return () => {
      cancelledRef.current = true
    }
  }, [lat, lng, radiusKm, enabled])

  return { markers, loading, error }
}

interface MatchedPlace extends Place {
  retailer: string
}

/**
 * Match Overpass Place results back to known retailers by checking if
 * the place name or brand tag contains the retailer label (case-insensitive).
 */
function matchBrandsToRetailers(places: Place[]): MatchedPlace[] {
  const matched: MatchedPlace[] = []
  const seen = new Set<string>()

  for (const place of places) {
    if (seen.has(place.id)) continue

    const lowerName = place.name.toLowerCase()
    for (const r of RETAILERS) {
      if (r.value === 'other') continue
      if (lowerName.includes(r.label.toLowerCase())) {
        seen.add(place.id)
        matched.push({ ...place, retailer: r.value })
        break
      }
    }
  }

  return matched
}
