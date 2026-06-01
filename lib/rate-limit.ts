/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window counter per IP address.
 * In production, this should be replaced with Redis or similar,
 * but for a small app this is sufficient.
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const limits = new Map<string, RateLimitEntry>()

// Clean up expired entries every 10 minutes
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
 * Check if a request is within rate limits.
 *
 * @param key - Identifier for the client (IP address, etc.)
 * @param limit - Maximum number of requests in the window
 * @param windowMs - Time window in milliseconds
 * @returns RateLimitResult with allowed status and remaining count
 */
export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60 * 1000 // 1 minute
): RateLimitResult {
  cleanup()

  const now = Date.now()
  const entry = limits.get(key)

  if (!entry || now > entry.resetTime) {
    // New window or expired
    limits.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetTime: now + windowMs }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetTime: entry.resetTime }
}

/**
 * Extract client IP from request headers.
 * Handles proxy headers like X-Forwarded-For and X-Real-IP.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  return 'unknown'
}
