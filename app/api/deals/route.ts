import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimitDB, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const searchParams = request.nextUrl.searchParams

  try {
    const clientIp = getClientIp(request)
    const rateLimit = await checkRateLimitDB(`deals-fetch:${clientIp}`, 30, 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests.' },
        { status: 429 }
      )
    }

    const retailer = searchParams.get('retailer')
    const activeOnly = searchParams.get('active') !== 'false'

    let query = supabase
      .from('deals')
      .select(`
        *,
        deal_products (
          product_id,
          quantity,
          products (id, name, variant, pack_size)
        )
      `)
      .order('valid_until', { ascending: true })

    if (activeOnly) {
      const now = new Date().toISOString()
      query = query
        .eq('is_active', true)
        .lte('valid_from', now)
        .gte('valid_until', now)
    }

    if (retailer) {
      query = query.eq('retailer', retailer)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const deals = (data ?? []).map((deal) => ({
      ...deal,
      products: (deal.deal_products ?? []).map((dp: Record<string, unknown>) => {
        const product = dp.products as Record<string, unknown> | null
        return {
          id: dp.product_id,
          name: product?.name ?? 'Unknown',
          variant: product?.variant ?? 'unknown',
          pack_size: product?.pack_size ?? 'single',
        }
      }),
    }))

    return NextResponse.json({ deals }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid input'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
