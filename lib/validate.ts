import { MIN_RADIUS_KM, MAX_RADIUS_KM } from './constants'

export function validateLat(value: unknown, field = 'lat'): number {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value)
  if (!Number.isFinite(num)) throw new Error(`Invalid ${field}: must be a valid number`)
  if (num < -90 || num > 90) throw new Error(`Invalid ${field}: must be between -90 and 90`)
  return num
}

export function validateLng(value: unknown, field = 'lng'): number {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value)
  if (!Number.isFinite(num)) throw new Error(`Invalid ${field}: must be a valid number`)
  if (num < -180 || num > 180) throw new Error(`Invalid ${field}: must be between -180 and 180`)
  return num
}

export function validateRadius(value: unknown, field = 'radius'): number {
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
  if (value.length > max) throw new Error(`Invalid ${field}: must be at most ${max} characters`)
  return value
}

export function validatePrice(value: unknown, field = 'price'): number {
  const num = Number(value)
  if (!Number.isFinite(num)) throw new Error(`Invalid ${field}: must be a valid finite number`)
  if (num < 1 || num > 50) throw new Error(`Invalid ${field}: must be between 1 and 50`)
  return num
}
