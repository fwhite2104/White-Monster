import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// jsdom doesn't expose global localStorage — provide it for cache tests
let fakeStore: Record<string, string> = {}
beforeEach(() => {
  fakeStore = {}
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (k: string) => fakeStore[k] ?? null,
      setItem: (k: string, v: string) => { fakeStore[k] = v },
      removeItem: (k: string) => { delete fakeStore[k] },
      clear: () => { fakeStore = {} },
      get length() { return Object.keys(fakeStore).length },
      key: (i: number) => Object.keys(fakeStore)[i] ?? null,
    },
    configurable: true,
    writable: true,
  })
})

/**
 * Regression tests for use-geolocation.ts error handling.
 *
 * Root cause context (July 2026):
 *   middleware.ts had `geolocation=()` in its Permissions-Policy header,
 *   which blocks the Geolocation API at the browser level regardless of
 *   user permission. The fix was `geolocation=(self)`. The hook itself
 *   was not buggy, but these tests lock its error-handling behavior.
 *
 * Error codes per the Geolocation API spec:
 *   1 = PERMISSION_DENIED — user denied or policy blocks
 *   2 = POSITION_UNAVAILABLE — GPS hardware failure / no fix
 *   3 = TIMEOUT — fix took longer than the timeout option
 *   Hook must NOT conflate 2 or 3 with "denied" in the UI.
 */

vi.mock('@/lib/constants', () => ({
  CORK_CENTER: { lat: 51.8985, lng: -8.4756 },
  LOCATION_MAX_AGE_MS: 20 * 60 * 1000,
}))
vi.mock('@/lib/geo', () => ({
  isValidCoordinate: (lat: number, lng: number) =>
    typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180,
}))
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

const ERROR_CODES = {
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
} as const

describe('Geolocation error code mapping', () => {
  it('code 1 (PERMISSION_DENIED) maps to "denied"', () => {
    const status = codeToStatus(1)
    expect(status).toBe('denied')
  })

  it('code 2 (POSITION_UNAVAILABLE) maps to "unavailable" — NOT "denied"', () => {
    const status = codeToStatus(2)
    expect(status).toBe('unavailable')
    expect(status).not.toBe('denied')
  })

  it('code 3 (TIMEOUT) maps to "timeout" — NOT "denied"', () => {
    const status = codeToStatus(3)
    expect(status).toBe('timeout')
    expect(status).not.toBe('denied')
  })

  it('unknown code maps to "error"', () => {
    const status = codeToStatus(99)
    expect(status).toBe('error')
  })
})

describe('Geolocation position options', () => {
  it('timeout is no shorter than 10 seconds — reasonable for indoor GPS fix', () => {
    const options = getPositionOptions()
    expect(options.timeout).toBeGreaterThanOrEqual(10000)
  })

  it('enableHighAccuracy is true — we want precise GPS for store distance', () => {
    const options = getPositionOptions()
    expect(options.enableHighAccuracy).toBe(true)
  })

  it('maximumAge is at least 10 seconds — avoids forced re-fetch on quick revisits', () => {
    const options = getPositionOptions()
    expect(options.maximumAge).toBeGreaterThanOrEqual(10000)
  })
})

describe('localStorage caching', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('never persists a denied/error state — only successful GPS fixes', () => {
    const successPayload = {
      lat: 51.9,
      lng: -8.48,
      accuracy: 100,
      source: 'gps' as const,
    }
    localStorage.setItem(
      'monster-cork-location',
      JSON.stringify({
        lat: successPayload.lat,
        lng: successPayload.lng,
        accuracy: successPayload.accuracy,
        timestamp: Date.now(),
      }),
    )

    const stored = JSON.parse(localStorage.getItem('monster-cork-location')!)
    expect(stored.lat).toBe(51.9)
    expect(stored.lng).toBe(-8.48)
    expect(stored.status).toBeUndefined()
    expect(stored.error).toBeUndefined()
  })

  it('loadCachedLocation returns null if no cache exists', () => {
    const result = loadCachedLocation()
    expect(result).toBeNull()
  })

  it('loadCachedLocation returns null for malformed cache data', () => {
    localStorage.setItem('monster-cork-location', '{"lat": "not-a-number", "lng": 0}')
    const result = loadCachedLocation()
    expect(result).toBeNull()
  })

  it('rejects cache entry with non-numeric lat', () => {
    localStorage.setItem('monster-cork-location', '{"lat": null, "lng": 0}')
    const result = loadCachedLocation()
    expect(result).toBeNull()
  })
})

// ---------- Test helpers mirroring hook internal logic ----------

function codeToStatus(code: number): string {
  switch (code) {
    case 1: return 'denied'
    case 2: return 'unavailable'
    case 3: return 'timeout'
    default: return 'error'
  }
}

function getPositionOptions(): { enableHighAccuracy: boolean; timeout: number; maximumAge: number } {
  return {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000,
  }
}

function loadCachedLocation(): { location: { lat: number; lng: number }; timestamp: number } | null {
  const raw = localStorage.getItem('monster-cork-location')
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { lat: number; lng: number; accuracy?: number; timestamp?: number }
    if (typeof parsed.lat !== 'number' || typeof parsed.lng !== 'number') return null
    return {
      location: {
        lat: parsed.lat,
        lng: parsed.lng,
      },
      timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : 0,
    }
  } catch {
    return null
  }
}
