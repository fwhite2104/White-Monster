import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkRateLimitDB, getClientIp } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const startTime = Date.now()

  try {
    const clientIp = getClientIp(request)
    const rateLimit = await checkRateLimitDB(`health:${clientIp}`, 30, 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests.' },
        { status: 429 }
      )
    }

    const supabase = await createClient()

    // Check database connectivity
    const { error: dbError } = await supabase
      .from('products')
      .select('id')
      .limit(1)

    if (dbError) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          error: dbError.message,
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      )
    }

    // Check data freshness - when was the last scrape?
    const { data: latestPrice, error: priceError } = await supabase
      .from('prices')
      .select('scraped_at')
      .eq('source', 'scraper')
      .order('scraped_at', { ascending: false })
      .limit(1)
      .single()

    // Get counts for monitoring
    const { count: storeCount } = await supabase
      .from('stores')
      .select('id', { count: 'exact', head: true })

    const { count: productCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })

    const { count: priceCount } = await supabase
      .from('prices')
      .select('id', { count: 'exact', head: true })

    const responseTime = Date.now() - startTime

    // Determine freshness status
    let freshnessStatus = 'unknown'
    let lastScrapedAt: string | null = null
    if (latestPrice && !priceError) {
      lastScrapedAt = latestPrice.scraped_at
      const hoursSinceScrape =
        (Date.now() - new Date(latestPrice.scraped_at).getTime()) /
        (1000 * 60 * 60)
      if (hoursSinceScrape < 48) {
        freshnessStatus = 'fresh'
      } else if (hoursSinceScrape < 168) {
        freshnessStatus = 'stale'
      } else {
        freshnessStatus = 'outdated'
      }
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTimeMs: responseTime,
      freshness: {
        status: freshnessStatus,
        lastScrapedAt,
      },
      counts: {
        stores: storeCount ?? 0,
        products: productCount ?? 0,
        prices: priceCount ?? 0,
      },
    })
  } catch (err) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
