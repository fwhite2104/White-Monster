import { describe, it, expect } from 'vitest'
import { CORK_LOCATIONS, searchLocations } from '@/lib/location'

describe('CORK_LOCATIONS', () => {
  it('has at least 20 entries', () => {
    expect(CORK_LOCATIONS.length).toBeGreaterThanOrEqual(20)
  })

  it('each location has valid label, suburb, lat, lng', () => {
    for (const loc of CORK_LOCATIONS) {
      expect(typeof loc.label).toBe('string')
      expect(loc.label.length).toBeGreaterThan(0)
      expect(typeof loc.suburb).toBe('string')
      expect(loc.suburb.length).toBeGreaterThan(0)
      expect(typeof loc.lat).toBe('number')
      expect(typeof loc.lng).toBe('number')
    }
  })
})

describe('searchLocations', () => {
  it('returns empty array for empty string', () => {
    expect(searchLocations('')).toEqual([])
  })

  it('returns matches for "cork" in label or suburb', () => {
    const results = searchLocations('cork')
    expect(results.length).toBeGreaterThan(0)
    for (const result of results) {
      const labelMatch = result.label.toLowerCase().includes('cork')
      const suburbMatch = result.suburb.toLowerCase().includes('cork')
      expect(labelMatch || suburbMatch).toBe(true)
    }
  })

  it('returns at least 1 match for "Douglas"', () => {
    const results = searchLocations('Douglas')
    expect(results.length).toBeGreaterThanOrEqual(1)
  })

  it('returns empty array for "xyz123"', () => {
    expect(searchLocations('xyz123')).toEqual([])
  })

  it('limits results to 10', () => {
    const results = searchLocations('c')
    expect(results.length).toBeLessThanOrEqual(10)
  })
})
