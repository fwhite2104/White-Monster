import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { validateEnum } from '@/lib/validate'
import { MONSTER_VARIANTS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const searchParams = request.nextUrl.searchParams

  try {
    const variantParam = searchParams.get('variant')
    if (!variantParam) {
      return NextResponse.json({ error: 'variant is required' }, { status: 400 })
    }
    const variant = validateEnum(variantParam, 'variant', MONSTER_VARIANTS.map((v) => v.value))

    const retailerParam = searchParams.get('retailer')
    const daysParam = searchParams.get('days') ?? '30'
    const days = Math.min(Math.max(parseInt(daysParam, 10) || 30, 1), 90)

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    let query = supabase
      .from('price_history')
      .select(`
        price,
        recorded_at,
        stores!inner (retailer),
        products!inner (variant)
      `)
      .eq('products.variant', variant)
      .gte('recorded_at', cutoff.toISOString())
      .order('recorded_at', { ascending: true })

    if (retailerParam) {
      const retailer = validateEnum(retailerParam, 'retailer', [
        'lidl', 'aldi', 'tesco', 'supervalu', 'dunnes', 'centra', 'spar',
        'dealz', 'londis', 'costcutter', 'other',
      ])
      query = query.eq('stores.retailer', retailer)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const history = (data ?? []).map((row: Record<string, unknown>) => {
      const stores = row.stores as Record<string, unknown>
      return {
        date: String(row.recorded_at).slice(0, 10),
        price: Number(row.price),
        retailer: String(stores.retailer),
      }
    })

    const prices = history.map((h) => h.price)
    const stats = {
      min: prices.length > 0 ? Math.min(...prices) : null,
      max: prices.length > 0 ? Math.max(...prices) : null,
      avg: prices.length > 0 ? Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100 : null,
      dataPoints: prices.length,
    }

    return NextResponse.json({ history, stats }, {
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=600' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid input'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
