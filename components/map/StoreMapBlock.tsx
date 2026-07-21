'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { RETAILERS } from '@/lib/constants'
import type { StoreMarker } from '@/lib/types'

interface StoreMapBlockProps {
  markers: StoreMarker[]
  userLat: number
  userLng: number
  radiusKm: number
  userAccuracy?: number
  onLocationSelect?: (lat: number, lng: number) => void
}

async function createLetterBadge(letter: string, color: string): Promise<ImageBitmap> {
  const size = 40
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = `bold ${size * 0.45}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(letter.toUpperCase(), size / 2, size / 2)
  return createImageBitmap(canvas)
}

async function loadBrandLogo(map: maplibregl.Map, id: string, url: string): Promise<boolean> {
  try {
    const resp = await fetch(url)
    if (!resp.ok) return false
    const blob = await resp.blob()
    const bitmap = await createImageBitmap(blob)
    if (map.getImage(id)) return true
    map.addImage(id, bitmap)
    return true
  } catch {
    return false
  }
}

function accuracyCirclePolygon(lat: number, lng: number, radiusMeters: number): GeoJSON.Polygon {
  const segments = 64
  const coords: number[][] = []
  const latRad = (lat * Math.PI) / 180
  const degPerMeter = 1 / 111320
  const lngDegPerMeter = degPerMeter / Math.cos(latRad)

  for (let i = 0; i <= segments; i++) {
    const angle = (i * 2 * Math.PI) / segments
    coords.push([lng + lngDegPerMeter * radiusMeters * Math.cos(angle), lat + degPerMeter * radiusMeters * Math.sin(angle)])
  }

  return { type: 'Polygon', coordinates: [coords] }
}

export function StoreMapBlock({ markers, userLat, userLng, userAccuracy, onLocationSelect }: StoreMapBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || markers.length === 0) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [userLng, userLat],
      zoom: 12,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.on('load', async () => {
      const colorMap = Object.fromEntries(
        RETAILERS.map((r) => [r.value, r.color ?? '#666'])
      )

      // Load brand logos for each unique retailer
      const seenLogo = new Set<string>()
      const loadPromises: Promise<void>[] = []

      for (const m of markers) {
        const logoId = `logo_${m.retailer}`
        if (seenLogo.has(logoId)) continue
        seenLogo.add(logoId)

        const ext = m.retailer === 'dealz' ? '.png' : '.svg'
        const url = `/images/brands/${m.retailer}${ext}`
        loadPromises.push(
          loadBrandLogo(map, logoId, url).then(async (loaded) => {
            if (!loaded) {
              const letter = m.retailer.charAt(0).toUpperCase()
              const color = colorMap[m.retailer] ?? '#6B7280'
              const badge = await createLetterBadge(letter, color)
              map.addImage(logoId, badge)
            }
          })
        )
      }

      await Promise.all(loadPromises)

      const features: GeoJSON.Feature[] = markers.map((m) => ({
        type: 'Feature',
        properties: {
          logo_id: `logo_${m.retailer}`,
          name: m.name,
          retailer: m.retailer,
        },
        geometry: { type: 'Point', coordinates: [m.lng, m.lat] },
      }))

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
        type: 'symbol',
        source: 'retailers',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'icon-image': ['get', 'logo_id'],
          'icon-size': 0.4,
          'icon-allow-overlap': true,
        },
      })

      if (userAccuracy !== undefined && userAccuracy > 0) {
        const polygon = accuracyCirclePolygon(userLat, userLng, userAccuracy)
        map.addSource('accuracy', {
          type: 'geojson',
          data: { type: 'Feature', geometry: polygon, properties: {} },
        })
        map.addLayer({
          id: 'accuracy-fill',
          type: 'fill',
          source: 'accuracy',
          paint: { 'fill-color': '#22c55e', 'fill-opacity': 0.12 },
        })
        map.addLayer({
          id: 'accuracy-outline',
          type: 'line',
          source: 'accuracy',
          paint: { 'line-color': '#22c55e', 'line-opacity': 0.3, 'line-width': 1.5 },
        })
      }

      new maplibregl.Marker({ color: '#22c55e' })
        .setLngLat([userLng, userLat])
        .addTo(map)

      map.on('click', (e) => onLocationSelect?.(e.lngLat.lat, e.lngLat.lng))
    })

    return () => {
      map.remove()
    }
  }, [userLat, userLng, markers, userAccuracy, onLocationSelect])

  return (
    <div ref={containerRef} className="h-[300px] md:h-[400px] rounded-xl z-0" />
  )
}
