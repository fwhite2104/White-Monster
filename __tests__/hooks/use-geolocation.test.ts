import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { useGeolocation } from '@/hooks/use-geolocation'
import { CORK_CENTER } from '@/lib/constants'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

function renderHook<T>(hook: () => T): { result: { current: T }; unmount: () => void } {
  const result = { current: null as T }
  function TestComponent() {
    result.current = hook()
    return null
  }
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(React.createElement(TestComponent))
  })
  return {
    result,
    unmount: () => {
      act(() => {
        root.unmount()
      })
      document.body.removeChild(container)
    },
  }
}

describe('useGeolocation', () => {
  let mockSuccessCallback: PositionCallback | null = null
  let mockErrorCallback: PositionErrorCallback | null = null
  let mockGetCurrentPosition: ReturnType<typeof vi.fn>
  let originalLocalStorage: Storage

  beforeEach(() => {
    mockSuccessCallback = null
    mockErrorCallback = null
    mockGetCurrentPosition = vi.fn((success: PositionCallback, error: PositionErrorCallback) => {
      mockSuccessCallback = success
      mockErrorCallback = error
    })

    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: mockGetCurrentPosition,
      },
    })

    originalLocalStorage = window.localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    } as unknown as Storage

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    })
  })

  it('returns correct initial state', () => {
    const { result, unmount } = renderHook(() => useGeolocation())
    expect(result.current.status).toBe('idle')
    expect(result.current.location).toEqual({
      lat: CORK_CENTER.lat,
      lng: CORK_CENTER.lng,
      source: 'default',
    })
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.locationLabel).toBe('Showing Cork area')
    unmount()
  })

  it('requestLocation calls navigator.geolocation.getCurrentPosition', () => {
    const { result, unmount } = renderHook(() => useGeolocation())
    act(() => {
      result.current.requestLocation()
    })
    expect(mockGetCurrentPosition).toHaveBeenCalledOnce()
    unmount()
  })

  it('sets status to success with coords when position received', () => {
    const { result, unmount } = renderHook(() => useGeolocation())
    act(() => {
      result.current.requestLocation()
    })
    const mockPosition = {
      coords: {
        latitude: 51.9,
        longitude: -8.47,
        accuracy: 50,
      },
    } as GeolocationPosition
    act(() => {
      mockSuccessCallback!(mockPosition)
    })
    expect(result.current.status).toBe('success')
    expect(result.current.location).toEqual({
      lat: 51.9,
      lng: -8.47,
      accuracy: 50,
      source: 'gps',
    })
    expect(result.current.error).toBeNull()
    unmount()
  })

  it('sets status to denied and error message when permission denied (code 1)', () => {
    const { result, unmount } = renderHook(() => useGeolocation())
    act(() => {
      result.current.requestLocation()
    })
    const mockError = {
      code: 1,
      message: 'Permission denied',
    } as GeolocationPositionError
    act(() => {
      mockErrorCallback!(mockError)
    })
    expect(result.current.status).toBe('denied')
    expect(result.current.error).toContain('denied')
    unmount()
  })

  it('sets status to timeout when timeout (code 3)', () => {
    const { result, unmount } = renderHook(() => useGeolocation())
    act(() => {
      result.current.requestLocation()
    })
    const mockError = {
      code: 3,
      message: 'Timeout',
    } as GeolocationPositionError
    act(() => {
      mockErrorCallback!(mockError)
    })
    expect(result.current.status).toBe('timeout')
    expect(result.current.error).toContain('timed out')
    unmount()
  })

  it('sets status to unavailable when unavailable (code 2)', () => {
    const { result, unmount } = renderHook(() => useGeolocation())
    act(() => {
      result.current.requestLocation()
    })
    const mockError = {
      code: 2,
      message: 'Unavailable',
    } as GeolocationPositionError
    act(() => {
      mockErrorCallback!(mockError)
    })
    expect(result.current.status).toBe('unavailable')
    expect(result.current.error).toContain('unavailable')
    unmount()
  })

  it('setManualLocation sets status to success with source manual and label', () => {
    const { result, unmount } = renderHook(() => useGeolocation())
    act(() => {
      result.current.setManualLocation(1, 2, 'Test Location')
    })
    expect(result.current.status).toBe('success')
    expect(result.current.location).toEqual({
      lat: 1,
      lng: 2,
      source: 'manual',
      label: 'Test Location',
    })
    expect(result.current.locationLabel).toBe('Test Location')
    unmount()
  })

  it('resetLocation sets status to idle with default location', () => {
    const { result, unmount } = renderHook(() => useGeolocation())
    act(() => {
      result.current.setManualLocation(1, 2, 'Test')
    })
    expect(result.current.status).toBe('success')
    act(() => {
      result.current.resetLocation()
    })
    expect(result.current.status).toBe('idle')
    expect(result.current.location).toEqual({
      lat: CORK_CENTER.lat,
      lng: CORK_CENTER.lng,
      source: 'default',
    })
    expect(result.current.error).toBeNull()
    unmount()
  })

  describe('locationLabel', () => {
    it('returns "Showing Cork area" for default source', () => {
      const { result, unmount } = renderHook(() => useGeolocation())
      expect(result.current.locationLabel).toBe('Showing Cork area')
      unmount()
    })

    it('returns label for manual source with label', () => {
      const { result, unmount } = renderHook(() => useGeolocation())
      act(() => {
        result.current.setManualLocation(1, 2, 'My Label')
      })
      expect(result.current.locationLabel).toBe('My Label')
      unmount()
    })

    it('returns "Custom location" for manual source without label', () => {
      const { result, unmount } = renderHook(() => useGeolocation())
      act(() => {
        result.current.setManualLocation(1, 2)
      })
      expect(result.current.locationLabel).toBe('Custom location')
      unmount()
    })

    it('returns "Using saved location" for cached source', () => {
      ;(window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
        JSON.stringify({ lat: 51.9, lng: -8.47, accuracy: 50 })
      )
      const { result, unmount } = renderHook(() => useGeolocation())
      expect(result.current.status).toBe('success')
      expect(result.current.location?.source).toBe('cached')
      expect(result.current.locationLabel).toBe('Using saved location')
      unmount()
    })

    it('returns "Using current location" for gps with accuracy <= 100', () => {
      const { result, unmount } = renderHook(() => useGeolocation())
      act(() => {
        result.current.requestLocation()
      })
      act(() => {
        mockSuccessCallback!({
          coords: { latitude: 51.9, longitude: -8.47, accuracy: 50 },
        } as GeolocationPosition)
      })
      expect(result.current.locationLabel).toBe('Using current location')
      unmount()
    })

    it('returns "Approximate location" for gps with accuracy <= 500', () => {
      const { result, unmount } = renderHook(() => useGeolocation())
      act(() => {
        result.current.requestLocation()
      })
      act(() => {
        mockSuccessCallback!({
          coords: { latitude: 51.9, longitude: -8.47, accuracy: 300 },
        } as GeolocationPosition)
      })
      expect(result.current.locationLabel).toBe('Approximate location')
      unmount()
    })

    it('returns "Location may be inaccurate" for gps with accuracy > 500', () => {
      const { result, unmount } = renderHook(() => useGeolocation())
      act(() => {
        result.current.requestLocation()
      })
      act(() => {
        mockSuccessCallback!({
          coords: { latitude: 51.9, longitude: -8.47, accuracy: 1000 },
        } as GeolocationPosition)
      })
      expect(result.current.locationLabel).toBe('Location may be inaccurate')
      unmount()
    })

    it('returns "Using current location" for gps with undefined accuracy', () => {
      const { result, unmount } = renderHook(() => useGeolocation())
      act(() => {
        result.current.requestLocation()
      })
      act(() => {
        mockSuccessCallback!({
          coords: { latitude: 51.9, longitude: -8.47 },
        } as GeolocationPosition)
      })
      expect(result.current.locationLabel).toBe('Using current location')
      unmount()
    })

    it('returns "Showing Cork area" for non-success status even with non-default source', () => {
      const { result, unmount } = renderHook(() => useGeolocation())
      act(() => {
        result.current.requestLocation()
      })
      act(() => {
        mockErrorCallback!({ code: 1, message: 'Denied' } as GeolocationPositionError)
      })
      expect(result.current.status).toBe('denied')
      expect(result.current.locationLabel).toBe('Showing Cork area')
      unmount()
    })
  })

  it('loading is true when status is requesting', () => {
    const { result, unmount } = renderHook(() => useGeolocation())
    act(() => {
      result.current.requestLocation()
    })
    expect(result.current.loading).toBe(true)
    expect(result.current.status).toBe('requesting')
    unmount()
  })

  it('saves location to localStorage on gps success', () => {
    const { result, unmount } = renderHook(() => useGeolocation())
    act(() => {
      result.current.requestLocation()
    })
    act(() => {
      mockSuccessCallback!({
        coords: { latitude: 51.9, longitude: -8.47, accuracy: 50 },
      } as GeolocationPosition)
    })
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'monster-cork-location',
      JSON.stringify({ lat: 51.9, lng: -8.47, accuracy: 50 })
    )
    unmount()
  })
})
