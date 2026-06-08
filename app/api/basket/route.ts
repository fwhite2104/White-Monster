import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimitDB, getClientIp } from '@/lib/rate-limit'
import { optimiseBasket } from '@/lib/basket-optimizer'
import { MAX_BASKET_ITEMS } from '@/lib/basket-types'
import { MONSTER_VARIANTS } from '@/lib/constants'
import { validateLat, validateLng, validateRadius } from '@/lib/validate'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    const clientIp = getClientIp(request)
    const rateLimit = await checkRateLimitDB(`basket-opt:${clientIp}`, 10, 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
    }

    const body = await request.json()

    const items = body.items
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Basket must contain at least 1 item.' }, { status: 400 })
    }
    if (items.length > MAX_BASKET_ITEMS) {
      return NextResponse.json({ error: `Basket limited to ${MAX_BASKET_ITEMS} items.` }, { status: 400 })
    }

    const validVariants = MONSTER_VARIANTS.map((v) => v.value)
    for (const item of items) {
      if (!validVariants.includes(item.variant)) {
        return NextResponse.json({ error: `Invalid variant: ${item.variant}` }, { status: 400 })
      }
      if (!['single', '4_pack'].includes(item.pack_size)) {
        return NextResponse.json({ error: `Invalid pack_size: ${item.pack_size}` }, { status: 400 })
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
        return NextResponse.json({ error: `Invalid quantity for ${item.variant}` }, { status: 400 })
      }
    }

    const lat = validateLat(body.lat)
    const lng = validateLng(body.lng)
    const radiusKm = body.radius ? validateRadius(body.radius) : 10
    const radiusMeters = radiusKm * 1000

    const variantFilters = [...new Set(items.map((i: { variant: string }) => i.variant))]

    const allPrices: Array<Record<string, unknown>> = []
    for (const variant of variantFilters) {
      const { data: rpcData, error: rpcError } = await supabase.rpc('nearby_prices', {
        p_user_lat: lat,
        p_user_lng: lng,
        p_radius_meters: radiusMeters,
        p_variant_filter: variant,
        p_sort_by: 'price',
        p_pack_size_filter: 'all',
      })

      if (rpcError) {
        return NextResponse.json({ error: rpcError.message }, { status: 500 })
      }

      allPrices.push(...(rpcData ?? []))
    }

    const prices = allPrices.map((row) => ({
      id: row.id as string,
      store_id: row.store_id as string,
      product_id: row.product_id as string,
      price: Number(row.price),
      distance: Number(row.distance_meters),
      per_can_price: row.per_can_price != null ? Number(row.per_can_price) : undefined,
      stores: {
        id: row.store_id as string,
        name: row.store_name as string,
        retailer: row.store_retailer as string,
      },
      products: {
        variant: row.product_variant as string,
        pack_size: row.product_pack_size as string,
      },
    }))

    const result = optimiseBasket(items, prices)

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid input'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
