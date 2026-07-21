import { createServerClient } from '@/lib/supabase/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

const inMemoryLimits = new Map<string, RateLimitEntry>()

const CLEANUP_INTERVAL = 10 * 60 * 1000
let lastCleanup = Date.now()

function cleanupInMemory() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of inMemoryLimits) {
    if (now > entry.resetTime) {
      inMemoryLimits.delete(key)
    }
  }
}

/**
 * In-memory rate limiter — used as fallback when DB is unreachable.
 */
export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): RateLimitResult {
  cleanupInMemory()

  const now = Date.now()
  const entry = inMemoryLimits.get(key)

  if (!entry || now > entry.resetTime) {
    inMemoryLimits.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetTime: now + windowMs }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetTime: entry.resetTime }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

export async function checkRateLimitDB(
  key: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): Promise<RateLimitResult> {
  try {
    const supabase = await createServerClient()
    const colon = key.indexOf(':')
    const ip = colon === -1 ? key : key.substring(colon + 1)
    const endpoint = colon === -1 ? 'unknown' : key.substring(0, colon)

    const { data, error } = await supabase.rpc('upsert_rate_limit', {
      p_ip: ip,
      p_endpoint: endpoint,
      p_window_ms: windowMs,
      p_limit: limit,
    })

    if (error) throw error
    const result = data?.[0]
    if (!result) throw new Error('No rate limit result')

    const requestCount = result.request_count as number
    const resetTime = new Date(result.reset_time as string).getTime()
    return {
      allowed: requestCount <= limit,
      remaining: Math.max(0, limit - requestCount),
      resetTime,
    }
  } catch {
    console.warn(`[rate-limit] DB unreachable, falling back to in-memory limiter for key: ${key}`)
    return checkRateLimit(key, limit, windowMs)
  }
}

export function getClientIp(request: Request): string {
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return 'unknown'
}
