import { describe, it, expect } from 'vitest'
import { getPackCount, formatPackSize } from '@/lib/constants'

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
