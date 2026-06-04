'use client'

import { useState, useCallback, useRef } from 'react'
import { CORK_CENTER } from '@/lib/constants'
import { isValidCoordinate } from '@/lib/geo'

export type LocationSource = 'gps' | 'manual' | 'cached' | 'default'
export type LocationStatus = 'idle' | 'requesting' | 'success' | 'denied' | 'timeout' | 'unavailable' | 'error'

export interface LocationInfo {
  lat: number
  lng: number
  accuracy?: number
  source: LocationSource
  label?: string
}

export interface GeolocationResult {
  location: LocationInfo | null
  status: LocationStatus
  loading: boolean
  error: string | null
  locationLabel: string
  requestLocation: () => void
  setManualLocation: (lat: number, lng: number, label?: string) => void
  resetLocation: () => void
}

const STORAGE_KEY = 'monster-cork-location'

function isClient(): boolean {
  return typeof window !== 'undefined'
}

function getDefaultLocation(): LocationInfo {
  return {
    lat: CORK_CENTER.lat,
    lng: CORK_CENTER.lng,
    source: 'default',
  }
}

function getLocationLabel(location: LocationInfo | null, status: LocationStatus): string {
  if (!location) return 'Showing Cork area'

  if (location.source === 'default') return 'Showing Cork area'
  if (location.source === 'manual') return location.label || 'Custom location'
  if (location.source === 'cached') return 'Using saved location'

  if (status !== 'success') return 'Showing Cork area'

  const accuracy = location.accuracy
  if (accuracy === undefined) return 'Using current location'
  if (accuracy <= 100) return 'Using current location'
  if (accuracy <= 500) return 'Approximate location'
  return 'Location may be inaccurate'
}

function loadCachedLocation(): LocationInfo | null {
  if (!isClient()) return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { lat: number; lng: number; accuracy?: number }
    if (typeof parsed.lat !== 'number' || typeof parsed.lng !== 'number') return null
    return {
      lat: parsed.lat,
      lng: parsed.lng,
      accuracy: typeof parsed.accuracy === 'number' ? parsed.accuracy : undefined,
      source: 'cached',
    }
  } catch {
    return null
  }
}

function saveLocationToStorage(location: LocationInfo): void {
  if (!isClient()) return
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy,
      })
    )
  } catch {
    return
  }
}

interface InternalState {
  location: LocationInfo
  status: LocationStatus
  error: string | null
}

export function useGeolocation(): GeolocationResult {
  const [state, setState] = useState<InternalState>(() => {
    const cached = loadCachedLocation()
    if (cached) {
      return {
        location: cached,
        status: 'success',
        error: null,
      }
    }
    return {
      location: getDefaultLocation(),
      status: 'idle',
      error: null,
    }
  })

  const requestIdRef = useRef(0)

  const requestLocation = useCallback(() => {
    if (!isClient()) {
      setState({
        location: getDefaultLocation(),
        status: 'error',
        error: 'Geolocation is not available on the server',
      })
      return
    }

    if (!navigator.geolocation) {
      setState({
        location: getDefaultLocation(),
        status: 'unavailable',
        error: 'Geolocation is not supported by your browser',
      })
      return
    }

    const currentRequestId = ++requestIdRef.current

    setState((prev) => ({
      ...prev,
      status: 'requesting',
      error: null,
    }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (requestIdRef.current !== currentRequestId) return

        const rawLat = position.coords.latitude
        const rawLng = position.coords.longitude
        const accuracy = position.coords.accuracy

        // Validate GPS coordinates — fall back to Cork center if NaN or out of range
        if (!isValidCoordinate(rawLat, rawLng)) {
          setState({
            location: getDefaultLocation(),
            status: 'unavailable',
            error: 'Received invalid coordinates from GPS. Using default location.',
          })
          return
        }

        const location: LocationInfo = {
          lat: rawLat,
          lng: rawLng,
          accuracy,
          source: 'gps',
        }

        saveLocationToStorage(location)

        setState({
          location,
          status: 'success',
          error: null,
        })
      },
      (err) => {
        if (requestIdRef.current !== currentRequestId) return

        const messages: Record<number, string> = {
          1: 'Location permission denied. You can search for your area manually.',
          2: 'Location service is unavailable. Please try again later or set your location manually.',
          3: 'Location request timed out. Please try again or set your location manually.',
        }

        let status: LocationStatus
        switch (err.code) {
          case 1:
            status = 'denied'
            break
          case 2:
            status = 'unavailable'
            break
          case 3:
            status = 'timeout'
            break
          default:
            status = 'error'
        }

        setState({
          location: getDefaultLocation(),
          status,
          error: messages[err.code] || 'An unknown error occurred while getting your location.',
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    )
  }, [])

  const setManualLocation = useCallback((lat: number, lng: number, label?: string) => {
    requestIdRef.current++

    setState({
      location: {
        lat,
        lng,
        source: 'manual',
        label: label || 'Custom location',
      },
      status: 'success',
      error: null,
    })
  }, [])

  const resetLocation = useCallback(() => {
    requestIdRef.current++

    setState({
      location: getDefaultLocation(),
      status: 'idle',
      error: null,
    })
  }, [])

  const locationLabel = getLocationLabel(state.location, state.status)

  return {
    location: state.location,
    status: state.status,
    loading: state.status === 'requesting',
    error: state.error,
    locationLabel,
    requestLocation,
    setManualLocation,
    resetLocation,
  }
}
