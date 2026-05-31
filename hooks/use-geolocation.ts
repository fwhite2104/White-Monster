'use client'

import { useState, useCallback, useEffect } from 'react'

interface GeolocationState {
  location: { lat: number; lng: number } | null
  loading: boolean
  error: string | null
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    loading: false,
    error: null,
  })

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ location: null, loading: false, error: 'Geolocation not supported' })
      return
    }

    setState((s) => ({ ...s, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          loading: false,
          error: null,
        })
      },
      (err) => {
        const messages: Record<number, string> = {
          1: 'Location permission denied',
          2: 'Location unavailable',
          3: 'Location request timed out',
        }
        setState({
          location: null,
          loading: false,
          error: messages[err.code] || 'Unknown location error',
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    )
  }, [])

  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  return {
    location: state.location,
    loading: state.loading,
    error: state.error,
    requestLocation,
  }
}
