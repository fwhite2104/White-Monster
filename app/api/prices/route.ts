import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimitDB, getClientIp } from '@/lib/rate-limit'
import { splitPrice } from '@/lib/drs'
import {
  CORK_CENTER,
  DEFAULT_RADIUS_KM,
  MONSTER_VARIANTS,
  RETAILERS,
} from '@/lib/constants'
import {
  validateLat,
  validateLng,
  validateRadius,
  validateEnum,
  validateString,
  validatePrice,
  validateOptionalString,
} from '@/lib/validate'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const searchParams = request.nextUrl.searchParams

  try {
    const clientIp = getClientIp(request)
    const rateLimit = await checkRateLimitDB(`price-fetch:${clientIp}`, 60, 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
          },
        }
      )
    }

    const latParam = searchParams.get('lat')
    const lat = latParam !== null ? validateLat(latParam) : CORK_CENTER.lat

    const lngParam = searchParams.get('lng')
    const lng = lngParam !== null ? validateLng(lngParam) : CORK_CENTER.lng

    const radiusParam = searchParams.get('radius')
    const radiusKm = radiusParam !== null ? validateRadius(radiusParam) : DEFAULT_RADIUS_KM

    const variantParam = searchParams.get('variant') ?? 'zero_sugar'
    const variant = validateEnum(variantParam, 'variant', MONSTER_VARIANTS.map((v) => v.value))

    const sortParam = searchParams.get('sort') ?? 'price'
    const sort = validateEnum(sortParam, 'sort', ['price', 'distance', 'name'])

    const packSizeParam = searchParams.get('pack_size') ?? 'all'
    const packSize = validateEnum(packSizeParam, 'pack_size', ['all', 'single', '4_pack'])

    const radiusMeters = radiusKm * 1000

    const { data: rpcData, error: rpcError } = await supabase.rpc('nearby_prices', {
      p_user_lat: lat,
      p_user_lng: lng,
      p_radius_meters: radiusMeters,
      p_variant_filter: variant,
      p_sort_by: sort,
      p_pack_size_filter: packSize,
    })

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 500 })
    }

    const prices = (rpcData ?? []).map((row: Record<string, unknown>) => {
      const packSize = row.product_pack_size as string
      const totalPrice = Number(row.price)
      const { base_price, drs_deposit } = splitPrice(totalPrice, packSize)

      const storeRetailer = row.store_retailer as string
      const clubcardPrice = row.clubcard_price !== null ? row.clubcard_price : null
      const hasClubcardPricing = storeRetailer === 'tesco' && clubcardPrice !== null

      return {
        id: row.id,
        store_id: row.store_id,
        product_id: row.product_id,
        price: row.price,
        source: row.source,
        scraped_at: row.scraped_at,
        distance: row.distance_meters,
        per_can_price: row.per_can_price,
        base_price,
        drs_deposit,
        clubcard_price: clubcardPrice,
        has_clubcard_pricing: hasClubcardPricing,
        stores: {
          id: row.store_id,
          name: row.store_name,
          retailer: row.store_retailer,
          address: row.store_address,
          suburb: row.store_suburb,
          lat: Number(row.store_lat),
          lng: Number(row.store_lng),
        },
        products: {
          id: row.product_id,
          name: row.product_name,
          variant: row.product_variant,
          size_ml: row.product_size_ml,
          image_url: row.product_image_url,
          pack_size: packSize,
        },
      }
    })

    return NextResponse.json({
      prices,
      meta: {
        total: prices.length,
        radius: radiusKm,
        variant,
        pack_size: packSize,
        center: { lat, lng },
        sort,
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid input'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request)
    const rateLimit = await checkRateLimitDB(`price-submit:${clientIp}`, 5, 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many submissions. Please wait a minute before trying again.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.resetTime),
          },
        }
      )
    }

    const supabase = await createClient()
    const body = await request.json()

    const storeName = validateString(body.storeName, 'storeName', 1, 200)
    const retailer =
      body.retailer && body.retailer !== ''
        ? validateEnum(body.retailer, 'retailer', RETAILERS.map((r) => r.value))
        : 'other'
    const packSize = validateEnum(body.packSize ?? 'single', 'packSize', ['single', '4_pack'])
    const price = validatePrice(body.price, packSize)
    const variant = validateEnum(body.variant ?? 'zero_sugar', 'variant', MONSTER_VARIANTS.map((v) => v.value))
    const lat = validateLat(body.lat)
    const lng = validateLng(body.lng)
    const notes = validateOptionalString(body.notes, 'notes', 500)
    const address = validateOptionalString(body.address, 'address', 300)

    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .upsert(
        { name: storeName, retailer, lat, lng, address },
        { onConflict: 'name,retailer', ignoreDuplicates: true }
      )
      .select('id')

    if (storeError) {
      return NextResponse.json({ error: storeError.message }, { status: 500 })
    }

    let storeId = storeData?.[0]?.id
    if (!storeId) {
      const { data: existingStore, error: findStoreError } = await supabase
        .from('stores')
        .select('id')
        .eq('name', storeName)
        .eq('retailer', retailer)
        .single()

      if (findStoreError) {
        return NextResponse.json({ error: findStoreError.message }, { status: 500 })
      }
      storeId = existingStore?.id
    }

    if (!storeId) {
      return NextResponse.json({ error: 'Failed to create or find store' }, { status: 500 })
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('variant', variant)
      .eq('pack_size', packSize)
      .eq('is_active', true)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const { data: userPrice, error: insertError } = await supabase
      .from('user_prices')
      .insert({
        store_id: storeId,
        product_id: product.id,
        price,
        uploaded_by_ip: clientIp,
        notes,
      })
      .select(`
        id, store_id, product_id, price, notes, expires_at, created_at,
        stores (id, name, retailer, address, suburb, lat, lng),
        products (id, name, variant, size_ml, image_url, pack_size)
      `)
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json(userPrice, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
