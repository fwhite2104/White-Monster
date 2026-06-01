import { describe, it, expect } from 'vitest'
import { CORK_CENTER, RETAILERS, MONSTER_VARIANTS, DEFAULT_RADIUS_KM, MAX_RADIUS_KM, MIN_RADIUS_KM, getRetailerColor } from '@/lib/constants'

describe('CORK_CENTER', () => {
  it('has valid lat/lng for Cork', () => {
    expect(CORK_CENTER.lat).toBeGreaterThan(51)
    expect(CORK_CENTER.lat).toBeLessThan(52)
    expect(CORK_CENTER.lng).toBeGreaterThan(-9)
    expect(CORK_CENTER.lng).toBeLessThan(-8)
  })
})

describe('RETAILERS', () => {
  it('contains expected retailers', () => {
    const values = RETAILERS.map(r => r.value)
    expect(values).toContain('lidl')
    expect(values).toContain('tesco')
    expect(values).toContain('dunnes')
    expect(values).toContain('supervalu')
  })
  it('each retailer has a color', () => {
    RETAILERS.forEach(r => {
      expect(r.color).toBeTruthy()
      expect(r.color).toMatch(/^#[0-9a-fA-F]{6}$/)
    })
  })
})

describe('MONSTER_VARIANTS', () => {
  it('contains expected variants', () => {
    const values = MONSTER_VARIANTS.map(v => v.value)
    expect(values).toContain('zero_sugar')
    expect(values).toContain('ultra_white')
  })
  it('each variant has a size', () => {
    MONSTER_VARIANTS.forEach(v => {
      expect(v.size).toBe(250)
    })
  })
})

describe('getRetailerColor', () => {
  it('returns correct color for known retailers', () => {
    expect(getRetailerColor('tesco')).toBe('#EE1C2E')
    expect(getRetailerColor('TESCO')).toBe('#EE1C2E')
  })
  it('returns gray for unknown retailers', () => {
    expect(getRetailerColor('unknown')).toBe('#6B7280')
  })
})

describe('Radius constants', () => {
  it('has sensible bounds', () => {
    expect(MIN_RADIUS_KM).toBeLessThan(DEFAULT_RADIUS_KM)
    expect(DEFAULT_RADIUS_KM).toBeLessThan(MAX_RADIUS_KM)
    expect(MIN_RADIUS_KM).toBe(1)
    expect(DEFAULT_RADIUS_KM).toBe(10)
    expect(MAX_RADIUS_KM).toBe(50)
  })
})
