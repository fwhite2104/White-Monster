import { describe, it, expect } from 'vitest'
import { isValidCoordinate, isInRepublicBbox } from '../geo'

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

describe('isInRepublicBbox', () => {
  it('accepts Cork', () => {
    expect(isInRepublicBbox(51.8985, -8.4756)).toBe(true)
  })

  it('accepts Dublin', () => {
    expect(isInRepublicBbox(53.3498, -6.2603)).toBe(true)
  })

  it('accepts Galway', () => {
    expect(isInRepublicBbox(53.2707, -9.0578)).toBe(true)
  })

  it('accepts Limerick', () => {
    expect(isInRepublicBbox(52.6638, -8.6267)).toBe(true)
  })

  it('rejects Belfast (Northern Ireland)', () => {
    expect(isInRepublicBbox(54.5973, -5.9301)).toBe(false)
  })

  it('rejects London', () => {
    expect(isInRepublicBbox(51.5074, -0.1278)).toBe(false)
  })

  it('accepts just inside south edge (51.3)', () => {
    expect(isInRepublicBbox(51.3, -8.0)).toBe(true)
  })

  it('rejects just outside south edge (51.29)', () => {
    expect(isInRepublicBbox(51.29, -8.0)).toBe(false)
  })

  it('accepts just inside north edge (55.3)', () => {
    expect(isInRepublicBbox(55.3, -8.0)).toBe(true)
  })

  it('rejects just outside north edge (55.31)', () => {
    expect(isInRepublicBbox(55.31, -8.0)).toBe(false)
  })

  it('accepts just inside west edge (-10.6)', () => {
    expect(isInRepublicBbox(53.0, -10.6)).toBe(true)
  })

  it('rejects just outside west edge (-10.61)', () => {
    expect(isInRepublicBbox(53.0, -10.61)).toBe(false)
  })

  it('accepts just inside east edge (-6.0)', () => {
    expect(isInRepublicBbox(53.0, -6.0)).toBe(true)
  })

  it('rejects just outside east edge (-5.99)', () => {
    expect(isInRepublicBbox(53.0, -5.99)).toBe(false)
  })
})
