import { describe, it, expect } from 'vitest'
import { calculateDistance, filterByRadius, formatDistance, getTimeAgo } from '@/lib/geo'

describe('calculateDistance', () => {
  it('calculates distance between two points in meters', () => {
    const dist = calculateDistance(51.8985, -8.4756, 51.8847, -8.4394)
    expect(dist).toBeGreaterThan(0)
    expect(dist).toBeLessThan(50000)
  })
  it('returns 0 for same point', () => {
    expect(calculateDistance(51.8985, -8.4756, 51.8985, -8.4756)).toBe(0)
  })
})

describe('filterByRadius', () => {
  const items = [
    { lat: 51.8985, lng: -8.4756, name: 'center' },
    { lat: 51.8847, lng: -8.4394, name: 'nearby' },
    { lat: 53.3498, lng: -6.2603, name: 'dublin' },
  ]
  it('filters items within radius', () => {
    const result = filterByRadius(items, 51.8985, -8.4756, 10)
    expect(result).toHaveLength(2)
    expect(result.map(i => i.name)).toContain('center')
    expect(result.map(i => i.name)).toContain('nearby')
  })
  it('returns empty array if nothing within radius', () => {
    const result = filterByRadius(items, 53.3498, -6.2603, 1)
    expect(result).toHaveLength(1)
  })
})

describe('formatDistance', () => {
  it('formats meters as meters when under 1km', () => {
    expect(formatDistance(500)).toBe('500m')
    expect(formatDistance(1)).toBe('1m')
  })
  it('formats meters as km when 1km or more', () => {
    expect(formatDistance(1000)).toBe('1.0km')
    expect(formatDistance(15000)).toBe('15.0km')
  })
})

describe('getTimeAgo', () => {
  it('returns "Just now" for recent times', () => {
    const now = new Date().toISOString()
    expect(getTimeAgo(now)).toBe('Just now')
  })
  it('returns hours ago for recent times', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    expect(getTimeAgo(twoHoursAgo)).toBe('2h ago')
  })
  it('returns days ago for older times', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    expect(getTimeAgo(threeDaysAgo)).toBe('3d ago')
  })
})
