'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { RETAILERS } from '@/lib/constants'
import type { NationalSummary } from '@/lib/prices'

interface StoreMapBlockProps {
  summaries: NationalSummary[]
  userLat: number
  userLng: number
  radiusKm: number
  userAccuracy?: number
}

export function StoreMapBlock({ summaries, userLat, userLng, radiusKm }: StoreMapBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [userLng, userLat],
      zoom: 12,
      attributionControl: true,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.on('load', () => {
      const colorMap = Object.fromEntries(
        RETAILERS.map((r) => [r.value, r.color ?? '#666'])
      )

      const features: GeoJSON.Feature[] = summaries.map((s) => ({
        type: 'Feature',
        properties: {
          retailer: s.retailer,
          price: Number(s.price).toFixed(2),
          color: colorMap[s.retailer] ?? '#666',
          clubcard: s.clubcard_price ? `€${Number(s.clubcard_price).toFixed(2)}` : null,
        },
        geometry: { type: 'Point', coordinates: [userLng, userLat] },
      }))

      if (features.length > 0) {
        map.addSource('retailers', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features },
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        })

        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'retailers',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#22c55e',
            'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 50, 40],
            'circle-opacity': 0.7,
          },
        })

        map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'retailers',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 12,
          },
          paint: { 'text-color': '#fff' },
        })

        map.addLayer({
          id: 'markers',
          type: 'circle',
          source: 'retailers',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': ['get', 'color'],
            'circle-radius': 8,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
          },
        })

        map.addLayer({
          id: 'marker-labels',
          type: 'symbol',
          source: 'retailers',
          filter: ['!', ['has', 'point_count']],
          layout: {
            'text-field': ['get', 'retailer'],
            'text-size': 10,
            'text-offset': [0, 1.5],
            'text-anchor': 'top',
          },
          paint: { 'text-color': '#e5e7eb', 'text-halo-color': '#1c1c1c', 'text-halo-width': 1 },
        })
      }

      new maplibregl.Marker({ color: '#22c55e' })
        .setLngLat([userLng, userLat])
        .addTo(map)
    })

    return () => { map.remove() }
  }, [mounted, userLat, userLng, radiusKm, summaries])

  if (!mounted) {
    return (
      <div className="h-[300px] md:h-[400px] rounded-xl bg-muted shimmer-bar" aria-label="Loading map" />
    )
  }

  return (
    <div ref={containerRef} className="h-[300px] md:h-[400px] rounded-xl z-0" />
  )
}
