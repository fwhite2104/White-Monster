import { describe, it, expect } from 'vitest'
import { getPackCount, formatPackSize, MONSTER_VARIANTS, MONSTER_FAVOURITES, DEFAULT_CENTER, DEFAULT_RADIUS_KM, MAX_RADIUS_KM, MIN_RADIUS_KM } from '@/lib/constants'

describe('getPackCount', () => {
  it('returns 1 for single', () => {
    expect(getPackCount('single')).toBe(1)
  })

  it('returns 4 for 4_pack', () => {
    expect(getPackCount('4_pack')).toBe(4)
  })

  it('returns 6 for 6_pack', () => {
    expect(getPackCount('6_pack')).toBe(6)
  })

  it('returns 8 for 8_pack', () => {
    expect(getPackCount('8_pack')).toBe(8)
  })

  it('returns 9 for 9_pack', () => {
    expect(getPackCount('9_pack')).toBe(9)
  })

  it('falls back to 1 for invalid values', () => {
    expect(getPackCount('invalid')).toBe(1)
  })

  it('falls back to 1 for empty string', () => {
    expect(getPackCount('')).toBe(1)
  })
})

describe('formatPackSize', () => {
  it('formats single as "Single can"', () => {
    expect(formatPackSize('single')).toBe('Single can')
  })

  it('formats 4_pack as "4-Pack"', () => {
    expect(formatPackSize('4_pack')).toBe('4-Pack')
  })

  it('formats 6_pack as "6-Pack"', () => {
    expect(formatPackSize('6_pack')).toBe('6-Pack')
  })

  it('formats 8_pack as "8-Pack"', () => {
    expect(formatPackSize('8_pack')).toBe('8-Pack')
  })

  it('formats 9_pack as "9-Pack"', () => {
    expect(formatPackSize('9_pack')).toBe('9-Pack')
  })

  it('passes through unknown values', () => {
    expect(formatPackSize('unknown')).toBe('unknown')
  })

  it('passes through empty string', () => {
    expect(formatPackSize('')).toBe('')
  })
})

describe('MONSTER_VARIANTS', () => {
  it('includes strawberry_dreams', () => {
    const slugs = MONSTER_VARIANTS.map((v) => v.value)
    expect(slugs).toContain('strawberry_dreams')
  })

  it('includes aussie_lemonade', () => {
    const slugs = MONSTER_VARIANTS.map((v) => v.value)
    expect(slugs).toContain('aussie_lemonade')
  })
})

describe('MONSTER_FAVOURITES', () => {
  it('each favourite exists in MONSTER_VARIANTS', () => {
    const slugs = new Set(MONSTER_VARIANTS.map((v) => v.value))
    for (const slug of MONSTER_FAVOURITES) {
      expect(slugs.has(slug)).toBe(true)
    }
  })

  it('contains exactly 6 variants', () => {
    expect(MONSTER_FAVOURITES.length).toBe(6)
  })
})

describe('DEFAULT_CENTER and radius constants', () => {
  it('DEFAULT_CENTER equals Cork coords', () => {
    expect(DEFAULT_CENTER).toEqual({ lat: 51.8985, lng: -8.4756 })
  })

  it('DEFAULT_RADIUS_KM is 10', () => {
    expect(DEFAULT_RADIUS_KM).toBe(10)
  })

  it('MAX_RADIUS_KM is 50', () => {
    expect(MAX_RADIUS_KM).toBe(50)
  })

  it('MIN_RADIUS_KM is 1', () => {
    expect(MIN_RADIUS_KM).toBe(1)
  })
})
