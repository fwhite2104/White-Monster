import { MIN_RADIUS_KM, MAX_RADIUS_KM, getPackCount, PACK_SIZES } from './constants'

export function validateLat(value: unknown, field = 'lat'): number {
  if (value == null) throw new Error(`Invalid ${field}: must be a valid number`)
  const num = typeof value === 'string' ? parseFloat(value) : Number(value)
  if (!Number.isFinite(num)) throw new Error(`Invalid ${field}: must be a valid number`)
  if (num < -90 || num > 90) throw new Error(`Invalid ${field}: must be between -90 and 90`)
  return num
}

export function validateLng(value: unknown, field = 'lng'): number {
  if (value == null) throw new Error(`Invalid ${field}: must be a valid number`)
  const num = typeof value === 'string' ? parseFloat(value) : Number(value)
  if (!Number.isFinite(num)) throw new Error(`Invalid ${field}: must be a valid number`)
  if (num < -180 || num > 180) throw new Error(`Invalid ${field}: must be between -180 and 180`)
  return num
}

export function validateRadius(value: unknown, field = 'radius'): number {
  if (value == null) throw new Error(`Invalid ${field}: must be a valid number`)
  const num = typeof value === 'string' ? parseFloat(value) : Number(value)
  if (!Number.isFinite(num)) throw new Error(`Invalid ${field}: must be a valid number`)
  if (num < MIN_RADIUS_KM || num > MAX_RADIUS_KM) {
    throw new Error(`Invalid ${field}: must be between ${MIN_RADIUS_KM} and ${MAX_RADIUS_KM}`)
  }
  return num
}

export function validateString(value: unknown, field: string, min: number, max: number): string {
  if (typeof value !== 'string') throw new Error(`Invalid ${field}: must be a string`)
  const trimmed = value.trim()
  if (trimmed.length < min) throw new Error(`Invalid ${field}: must be between ${min} and ${max} characters`)
  if (trimmed.length > max) throw new Error(`Invalid ${field}: must be between ${min} and ${max} characters`)
  return trimmed
}

export function validateEnum(value: unknown, field: string, allowed: string[]): string {
  const str = String(value)
  if (!allowed.includes(str)) {
    throw new Error(`Invalid ${field}: must be one of: ${allowed.join(', ')}`)
  }
  return str
}

export function validateOptionalString(value: unknown, field: string, max: number): string | undefined {
  if (value == null || value === '') return undefined
  if (typeof value !== 'string') throw new Error(`Invalid ${field}: must be a string`)
  const trimmed = value.trim()
  if (trimmed.length > max) throw new Error(`Invalid ${field}: must be at most ${max} characters`)
  return trimmed
}

export function validatePrice(value: unknown, packSize: string = 'single', field = 'price'): number {
  const num = Number(value)
  if (!Number.isFinite(num)) throw new Error(`Invalid ${field}: must be a valid finite number`)
  const count = getPackCount(packSize)
  const perCanMin = 0.50
  const perCanMax = 2.00
  const min = perCanMin * count
  const max = perCanMax * count
  if (num < min || num > max) throw new Error(`Invalid ${field}: price must be between €${min.toFixed(2)} and €${max.toFixed(2)}`)
  return num
}
