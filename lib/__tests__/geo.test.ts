import { describe, it, expect } from 'vitest'
import { isValidCoordinate, validateCoordinate } from '../geo'

describe('isValidCoordinate', () => {
  it('accepts valid Cork center coords', () => {
    expect(isValidCoordinate(51.8985, -8.4756)).toBe(true)
  })

  it('rejects NaN lat', () => {
    expect(isValidCoordinate(NaN, -8.47)).toBe(false)
  })

  it('rejects NaN lng', () => {
    expect(isValidCoordinate(51.89, NaN)).toBe(false)
  })

  it('rejects Infinity lat', () => {
    expect(isValidCoordinate(Infinity, -8.47)).toBe(false)
  })

  it('rejects lat out of range (>90)', () => {
    expect(isValidCoordinate(91, 0)).toBe(false)
  })

  it('rejects lat out of range (<-90)', () => {
    expect(isValidCoordinate(-91, 0)).toBe(false)
  })

  it('rejects lng out of range (>180)', () => {
    expect(isValidCoordinate(0, 181)).toBe(false)
  })

  it('rejects lng out of range (<-180)', () => {
    expect(isValidCoordinate(0, -181)).toBe(false)
  })

  it('accepts boundary values', () => {
    expect(isValidCoordinate(90, 180)).toBe(true)
    expect(isValidCoordinate(-90, -180)).toBe(true)
  })

  it('rejects undefined coords', () => {
    expect(isValidCoordinate(undefined as unknown as number, 0)).toBe(false)
    expect(isValidCoordinate(0, undefined as unknown as number)).toBe(false)
  })

  it('rejects null coords', () => {
    expect(isValidCoordinate(null as unknown as number, 0)).toBe(false)
  })

  it('rejects string coords', () => {
    expect(isValidCoordinate('51.9' as unknown as number, -8.47)).toBe(false)
  })
})

describe('validateCoordinate', () => {
  const fallback = { lat: 51.8985, lng: -8.4756 }

  it('returns valid coords as-is', () => {
    const result = validateCoordinate(51.89, -8.47)
    expect(result).toEqual({ lat: 51.89, lng: -8.47 })
  })

  it('returns fallback for NaN coords', () => {
    const result = validateCoordinate(NaN, NaN, fallback)
    expect(result).toEqual(fallback)
  })

  it('returns fallback for undefined coords', () => {
    const result = validateCoordinate(undefined, undefined, fallback)
    expect(result).toEqual(fallback)
  })

  it('throws when no fallback and coords are invalid', () => {
    expect(() => validateCoordinate(NaN, NaN)).toThrow('Invalid coordinates')
  })

  it('returns fallback for null coords', () => {
    const result = validateCoordinate(null, 0, fallback)
    expect(result).toEqual(fallback)
  })

  it('returns fallback for Infinity lng', () => {
    const result = validateCoordinate(51.89, Infinity, fallback)
    expect(result).toEqual(fallback)
  })

  it('falls back to Cork center when passed invalid coords', () => {
    const result = validateCoordinate('' as unknown as number, undefined, fallback)
    expect(result).toEqual(fallback)
  })
})
