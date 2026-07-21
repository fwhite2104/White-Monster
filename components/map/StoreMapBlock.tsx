'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { RETAILERS } from '@/lib/constants'
import type { StoreMarker } from '@/lib/types'

export interface ActiveMarker {
  id: string
  lat: number
  lng: number
}

interface StoreMapBlockProps {
  markers: StoreMarker[]
  userLat: number
  userLng: number
  radiusKm: number
  userAccuracy?: number
  onLocationSelect?: (lat: number, lng: number) => void
  /** When set, dims all markers except this one and flies to it */
  activeMarker?: ActiveMarker | null
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function retailerColor(retailer: string): string {
  return RETAILERS.find((r) => r.value === retailer)?.color ?? '#6b7280'
}

function createMarkerEl(color: string): HTMLDivElement {
  const el = document.createElement('div')
  el.className = 'store-marker'
  el.style.width = '14px'
  el.style.height = '14px'
  el.style.borderRadius = '50%'
  el.style.background = color
  el.style.border = '2px solid #fff'
  el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)'
  el.style.cursor = 'pointer'
  el.style.transition = 'opacity 0.2s'
  return el
}

function createUserMarkerEl(): HTMLDivElement {
  const el = document.createElement('div')
  el.style.width = '16px'
  el.style.height = '16px'
  el.style.borderRadius = '50%'
  el.style.background = '#22c55e'
  el.style.border = '3px solid #fff'
  el.style.boxShadow = '0 0 0 2px rgba(34,197,94,0.4), 0 2px 6px rgba(0,0,0,0.3)'
  return el
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

// ─── Popup ──────────────────────────────────────────────────────────────────

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

// ─── Component ──────────────────────────────────────────────────────────────

interface MarkerEntry {
  id: string
  marker: maplibregl.Marker
  el: HTMLDivElement
}

export function StoreMapBlock({ markers, userLat, userLng, userAccuracy, onLocationSelect, activeMarker }: StoreMapBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<MarkerEntry[]>([])

  // ── 1. Map creation — runs once ──────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [userLng, userLat],
      zoom: 12,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    // Expose for E2E tests
    if (typeof window !== 'undefined') {
      ;(window as unknown as Record<string, unknown>).__monsterMap = map
    }

    // User location marker — shows immediately, no tile dependency
    new maplibregl.Marker({ element: createUserMarkerEl() })
      .setLngLat([userLng, userLat])
      .addTo(map)

    // Accuracy circle
    map.on('load', () => {
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
    })

    // Background click → close popup + set manual location
    map.on('click', (e) => {
      const target = e.originalEvent?.target
      if (target instanceof Element && target.closest('.store-marker, .maplibregl-popup, .maplibregl-popup-close-button')) return
      closePopup()
      onLocationSelect?.(e.lngLat.lat, e.lngLat.lng)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      markersRef.current = []
    }
    // Only create the map once — ignore prop changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── 2. Store markers + active marker dimming ────────────────────────────

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Remove old markers
    for (const entry of markersRef.current) {
      entry.marker.remove()
    }
    const entries: MarkerEntry[] = []

    for (const m of markers) {
      const color = retailerColor(m.retailer)
      const el = createMarkerEl(color)

      // Store data on element
      el.dataset.markerData = JSON.stringify(m)

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([m.lng, m.lat])
        .addTo(map)

      // Click → popup
      el.addEventListener('click', () => {
        showPopup(map, m)
      })

      entries.push({ id: m.id, marker, el })
    }

    // Apply active marker dim/highlight
    if (activeMarker) {
      for (const entry of entries) {
        if (entry.id === activeMarker.id) {
          entry.el.style.boxShadow = '0 0 0 2px #fff, 0 0 0 4px #22c55e, 0 2px 6px rgba(0,0,0,0.4)'
          entry.el.style.opacity = '1'
        } else {
          entry.el.style.opacity = '0.3'
        }
      }
    }

    markersRef.current = entries

    // Fly to active marker
    if (activeMarker) {
      map.flyTo({ center: [activeMarker.lng, activeMarker.lat], zoom: 14 })
    }
  }, [markers, activeMarker])

  return (
    <div ref={containerRef} className="h-[300px] md:h-[400px] rounded-xl z-0" />
  )
}

// ─── Popup helpers ──────────────────────────────────────────────────────────

let _popup: maplibregl.Popup | null = null

function closePopup() {
  _popup?.remove()
  _popup = null
}

function showPopup(map: maplibregl.Map, m: StoreMarker) {
  closePopup()
  _popup = new maplibregl.Popup({
    closeButton: true,
    closeOnClick: false,
    maxWidth: '280px',
    className: 'store-marker-popup',
  })
    .setLngLat([m.lng, m.lat])
    .setHTML(buildPopupContent(m))
    .addTo(map)
}
