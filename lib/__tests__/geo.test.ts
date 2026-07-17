import { describe, it, expect } from 'vitest'
import { isValidCoordinate } from '../geo'

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
