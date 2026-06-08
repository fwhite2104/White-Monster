import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimitDB, getClientIp } from '@/lib/rate-limit'
import { parseQuery } from '@/lib/ai/query-parser'
import { generateResponse } from '@/lib/ai/response-builder'
import { validateLat, validateLng, validateRadius } from '@/lib/validate'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    const clientIp = getClientIp(request)
    const rateLimit = await checkRateLimitDB(`chat:${clientIp}`, 20, 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const message = body.message
    if (typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 })
    }

    const lat = body.lat != null ? validateLat(body.lat) : 51.8985
    const lng = body.lng != null ? validateLng(body.lng) : -8.4756
    const radiusKm = body.radius != null ? validateRadius(body.radius) : 10

    const query = parseQuery(message)

    if (query.intent === 'help') {
      return NextResponse.json({ response: generateResponse(query, []) })
    }

    const radiusMeters = radiusKm * 1000
    const variantFilter = query.variant ?? 'zero_sugar'

    const { data: rpcData, error: rpcError } = await supabase.rpc('nearby_prices', {
      p_user_lat: lat,
      p_user_lng: lng,
      p_radius_meters: radiusMeters,
      p_variant_filter: variantFilter,
      p_sort_by: query.sort ?? 'price',
      p_pack_size_filter: query.packSize ?? 'all',
    })

    if (rpcError) {
      return NextResponse.json({ response: 'Sorry, I had trouble fetching prices. Please try again.' })
    }

    const prices = (rpcData ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      store_id: row.store_id as string,
      product_id: row.product_id as string,
      price: Number(row.price),
      source: row.source as string,
      scraped_at: row.scraped_at as string,
      created_at: row.scraped_at as string,
      distance: Number(row.distance_meters),
      per_can_price: row.per_can_price != null ? Number(row.per_can_price) : undefined,
      stores: {
        id: row.store_id as string,
        name: row.store_name as string,
        retailer: row.store_retailer as string,
        address: row.store_address as string,
        suburb: row.store_suburb as string,
        lat: Number(row.store_lat),
        lng: Number(row.store_lng),
        is_active: true,
        created_at: '',
        updated_at: '',
      },
      products: {
        id: row.product_id as string,
        name: row.product_name as string,
        variant: row.product_variant as string,
        size_ml: Number(row.product_size_ml),
        image_url: row.product_image_url as string,
        pack_size: row.product_pack_size as string,
        is_active: true,
        created_at: '',
      },
    }))

    const response = generateResponse(query, prices)

    return NextResponse.json({ response })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid input'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
