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

function formatKm(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`
}

/** @visibleForTesting */
export function buildPopupContent(m: StoreMarker): string {
  const priceStr = `€${m.price.toFixed(2)}`
  const perCanStr = m.pack_size !== 'single' ? `€${m.per_can_price.toFixed(2)}/can` : ''
  const addressParts = [m.address, m.suburb].filter(Boolean)
  const addressStr = addressParts.length > 0 ? addressParts.join(', ') : 'Ireland'
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`

  return `
    <div style="font-family: system-ui, sans-serif; color: #e2e8f0; line-height: 1.5; min-width: 200px;">
      <div style="font-weight: 600; font-size: 14px; margin-bottom: 2px;">${m.name}</div>
      <div style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">${addressStr} · ${formatKm(m.distance)}</div>
      <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px;">
        <span style="font-size: 18px; font-weight: 700; color: #f8fafc;">${priceStr}</span>
        ${perCanStr ? `<span style="font-size: 12px; color: #94a3b8;">${perCanStr}</span>` : ''}
      </div>
      ${m.drs_deposit > 0 ? `<div style="font-size: 11px; color: #94a3b8; margin-bottom: 4px;">Includes €${m.drs_deposit.toFixed(2)} DRS deposit</div>` : ''}
      ${m.has_clubcard_pricing && m.clubcard_price != null ? `<div style="font-size: 12px; color: #22c55e; font-weight: 500; margin-bottom: 6px;">Clubcard: €${m.clubcard_price.toFixed(2)}/can</div>` : ''}
      <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="
        display: inline-flex; align-items: center; gap: 4px;
        margin-top: 4px; padding: 6px 12px;
        background: #1e293b; color: #e2e8f0;
        border: 1px solid #334155; border-radius: 6px;
        font-size: 12px; font-weight: 500; text-decoration: none;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        Open in Google Maps
      </a>
    </div>
  `
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

    // Expose map instance for E2E tests — set early so tests can access it even if tiles fail to load
    if (typeof window !== 'undefined') {
      ;(window as any).__monsterMap = map
    }

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
          _marker_data: JSON.stringify(m),
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

      // Cluster click → zoom in
      map.on('click', 'clusters', (e) => {
        const feature = e.features?.[0]
        if (!feature) return
        const clusterId = feature.properties?.cluster_id
        if (clusterId === undefined) return
        const source = map.getSource('retailers') as maplibregl.GeoJSONSource | undefined
        source?.getClusterExpansionZoom(clusterId).then((zoom: number) => {
          const geometry = feature.geometry as GeoJSON.Point
          map.flyTo({ center: geometry.coordinates as [number, number], zoom })
        }).catch(() => {})
      })

      // Change cursor on hover over markers
      map.on('mouseenter', 'markers', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'markers', () => {
        map.getCanvas().style.cursor = ''
      })

      // Marker click → popup
      let currentPopup: maplibregl.Popup | null = null
      map.on('click', 'markers', (e) => {
        const feature = e.features?.[0]
        if (!feature) return

        const raw = feature.properties?._marker_data
        if (typeof raw !== 'string') return

        try {
          const markerData: StoreMarker = JSON.parse(raw)

          // Remove existing popup
          currentPopup?.remove()

          // Determine marker coordinates
          const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number]

          currentPopup = new maplibregl.Popup({
            closeButton: true,
            closeOnClick: false,
            maxWidth: '280px',
            className: 'store-marker-popup',
          })
            .setLngLat(coords)
            .setHTML(buildPopupContent(markerData))
            .addTo(map)
        } catch {
          // ignore parse errors
        }
      })

      // Map background click: close popup + set manual location
      // Only fires when not clicking a marker, cluster, or popup.
      map.on('click', (e) => {
        // Check if the click hit a marker or cluster feature
        const features = map.queryRenderedFeatures(e.point, { layers: ['markers', 'clusters'] })
        if (features.length > 0) return

        // Check if the click is inside an open popup
        const popupEl = document.querySelector('.maplibregl-popup')
        if (popupEl) {
          const rect = popupEl.getBoundingClientRect()
          if (
            e.originalEvent instanceof MouseEvent &&
            e.originalEvent.clientX >= rect.left &&
            e.originalEvent.clientX <= rect.right &&
            e.originalEvent.clientY >= rect.top &&
            e.originalEvent.clientY <= rect.bottom
          ) return
        }

        currentPopup?.remove()
        currentPopup = null
        onLocationSelect?.(e.lngLat.lat, e.lngLat.lng)
      })
    })

    return () => {
      map.remove()
    }
  }, [userLat, userLng, markers, userAccuracy, onLocationSelect])

  return (
    <div ref={containerRef} className="h-[300px] md:h-[400px] rounded-xl z-0" />
  )
}
