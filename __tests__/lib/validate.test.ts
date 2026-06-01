import { describe, it, expect } from 'vitest'
import { validateLat, validateLng, validateRadius, validateString, validateEnum, validatePrice, validateOptionalString } from '@/lib/validate'

describe('validateLat', () => {
  it('accepts valid latitudes', () => {
    expect(validateLat(51.8985)).toBe(51.8985)
    expect(validateLat(-23.5)).toBe(-23.5)
    expect(validateLat(0)).toBe(0)
  })
  it('accepts string input', () => {
    expect(validateLat('51.8985')).toBe(51.8985)
  })
  it('rejects latitudes outside -90 to 90', () => {
    expect(() => validateLat(91)).toThrow()
    expect(() => validateLat(-91)).toThrow()
  })
  it('rejects non-numeric input', () => {
    expect(() => validateLat('abc')).toThrow()
    expect(() => validateLat(NaN)).toThrow()
  })
})

describe('validateLng', () => {
  it('accepts valid longitudes', () => {
    expect(validateLng(-8.4756)).toBe(-8.4756)
    expect(validateLng(180)).toBe(180)
  })
  it('rejects longitudes outside -180 to 180', () => {
    expect(() => validateLng(181)).toThrow()
    expect(() => validateLng(-181)).toThrow()
  })
})

describe('validateRadius', () => {
  it('accepts valid radii', () => {
    expect(validateRadius(10)).toBe(10)
    expect(validateRadius(1)).toBe(1)
    expect(validateRadius(50)).toBe(50)
  })
  it('rejects radii outside 1-50', () => {
    expect(() => validateRadius(0)).toThrow()
    expect(() => validateRadius(51)).toThrow()
  })
})

describe('validateString', () => {
  it('trims whitespace', () => {
    expect(validateString('  hello  ', 'field', 1, 200)).toBe('hello')
  })
  it('rejects too short strings', () => {
    expect(() => validateString('', 'field', 1, 200)).toThrow()
  })
  it('rejects too long strings', () => {
    expect(() => validateString('a'.repeat(201), 'field', 1, 200)).toThrow()
  })
})

describe('validateEnum', () => {
  it('accepts valid values', () => {
    expect(validateEnum('price', 'sort', ['price', 'distance', 'name'])).toBe('price')
  })
  it('rejects invalid values', () => {
    expect(() => validateEnum('invalid', 'sort', ['price', 'distance', 'name'])).toThrow()
  })
})

describe('validatePrice', () => {
  it('accepts valid prices', () => {
    expect(validatePrice(2.50)).toBe(2.50)
    expect(validatePrice(1)).toBe(1)
    expect(validatePrice(50)).toBe(50)
  })
  it('rejects prices outside 1-50', () => {
    expect(() => validatePrice(0.99)).toThrow()
    expect(() => validatePrice(51)).toThrow()
  })
  it('rejects non-finite numbers', () => {
    expect(() => validatePrice(NaN)).toThrow()
    expect(() => validatePrice(Infinity)).toThrow()
  })
})

describe('validateOptionalString', () => {
  it('returns undefined for null/empty', () => {
    expect(validateOptionalString(null, 'field', 500)).toBeUndefined()
    expect(validateOptionalString('', 'field', 500)).toBeUndefined()
  })
  it('returns the string for valid input', () => {
    expect(validateOptionalString('hello', 'field', 500)).toBe('hello')
  })
  it('rejects too long strings', () => {
    expect(() => validateOptionalString('a'.repeat(501), 'field', 500)).toThrow()
  })
})
