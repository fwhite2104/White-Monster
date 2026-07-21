'use client'

import { useState, useEffect, useRef } from 'react'
import { queryBrandStores } from '@/lib/overpass'
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

        // Query each retailer in parallel
        const queries = RETAILERS.map((r) =>
          queryBrandStores(r.label, lat, lng, radiusMeters).catch(() => [] as never[]),
        )

        const settled = await Promise.allSettled(queries)

        for (let i = 0; i < settled.length; i++) {
          const result = settled[i]
          if (result.status !== 'fulfilled') continue

          const retailer = RETAILERS[i]
          const places = result.value as { id: string; name: string; lat: number; lng: number; address?: string }[]

          for (const place of places) {
            if (seen.has(place.id)) continue
            seen.add(place.id)

            const distance = calculateDistance(lat, lng, place.lat, place.lng)

            results.push({
              id: `osm_${place.id}`,
              retailer: retailer.value,
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
