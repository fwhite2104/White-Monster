import { createServerClient } from '@/lib/supabase/server'

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
    return { allowed: true, remaining: limit, resetTime: Date.now() + windowMs }
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
