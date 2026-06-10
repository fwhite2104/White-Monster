import { createServerClient } from '@/lib/supabase/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

const limits = new Map<string, RateLimitEntry>()

const CLEANUP_INTERVAL = 10 * 60 * 1000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of limits) {
    if (now > entry.resetTime) {
      limits.delete(key)
    }
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

/**
 * In-memory rate limiter — used as fallback when DB is unreachable.
 */
export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): RateLimitResult {
  cleanup()

  const now = Date.now()
  const entry = limits.get(key)

  if (!entry || now > entry.resetTime) {
    limits.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetTime: now + windowMs }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetTime: entry.resetTime }
}

function parseRateLimitKey(key: string): { ip: string; endpoint: string } {
  const firstColon = key.indexOf(':')
  if (firstColon === -1) return { ip: key, endpoint: 'unknown' }
  return {
    endpoint: key.substring(0, firstColon),
    ip: key.substring(firstColon + 1),
  }
}

/**
 * DB-backed rate limiter using the rate_limits table (migration 006).
 * Falls back to in-memory if Supabase is unreachable.
 */
export async function checkRateLimitDB(
  key: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): Promise<RateLimitResult> {
  try {
    const supabase = await createServerClient()
    const { ip, endpoint } = parseRateLimitKey(key)
    const now = new Date()
    const windowStart = new Date(now.getTime() - windowMs)

    const { count, error } = await supabase
      .from('rate_limits')
      .select('id', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .eq('endpoint', endpoint)
      .gte('window_end', windowStart.toISOString())

    if (error) throw error

    if (count !== null && count >= limit) {
      return { allowed: false, remaining: 0, resetTime: now.getTime() + windowMs }
    }

    await supabase.from('rate_limits').insert({
      ip_address: ip,
      endpoint,
      request_count: 1,
      window_start: now.toISOString(),
      window_end: new Date(now.getTime() + windowMs).toISOString(),
    })

    return {
      allowed: true,
      remaining: limit - (count ?? 0) - 1,
      resetTime: now.getTime() + windowMs,
    }
  } catch {
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
