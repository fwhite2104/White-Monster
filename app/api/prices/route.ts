import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimitDB, getClientIp } from '@/lib/rate-limit'
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
import type { PriceWithJoins } from '@/lib/types'
import { expandNationalPrices, mergeUserPrices, type PriceEntry, type UserPriceRecord } from '@/lib/prices'

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

    type RpcRow = {
      id: string
      store_id: string
      product_id: string
      price: number
      source: string
      scraped_at: string
      distance_meters: number
      per_can_price: number
      store_name: string
      store_retailer: string
      store_address: string
      store_suburb: string
      store_lat: number
      store_lng: number
      product_name: string
      product_variant: string
      product_size_ml: number
      product_image_url: string
      product_pack_size: string
    }

    const { data: rpcRows, error } = await supabase
      .rpc('nearby_prices', {
        p_user_lat: lat,
        p_user_lng: lng,
        p_radius_meters: radiusMeters,
        p_variant_filter: variant,
        p_sort_by: sort,
        p_pack_size_filter: packSize,
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const results: PriceEntry[] = (rpcRows ?? []).map((row: RpcRow) => ({
      id: row.id,
      store_id: row.store_id,
      product_id: row.product_id,
      price: Number(row.price),
      source: row.source,
      scraped_at: row.scraped_at,
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
        pack_size: row.product_pack_size,
      },
      distance: row.distance_meters,
      per_can_price: Number(row.per_can_price),
    }))

    const { data: nationalRows } = await supabase
      .from('prices')
      .select(`
        id, store_id, product_id, price, source, scraped_at,
        stores!inner (id, name, retailer, address, suburb, lat, lng),
        products!inner (id, name, variant, size_ml, image_url, pack_size)
      `)
      .eq('products.variant', variant)
      .like('stores.name', '%(National)%')
      .order('scraped_at', { ascending: false })

    const nationalPrices = (nationalRows ?? []) as unknown as PriceWithJoins[]

    if (nationalPrices.length > 0) {
      const { data: allStores, error: storesError } = await supabase
        .from('stores')
        .select('id, name, retailer, address, suburb, lat, lng')
        .eq('is_active', true)

      if (!storesError && allStores) {
        const expanded = expandNationalPrices(nationalPrices, allStores, lat, lng, radiusMeters, results)
        results.push(...expanded)
      }
    }

    // Fetch non-expired user-reported prices for the same variant
    const { data: userPrices, error: userPricesError } = await supabase
      .from('user_prices')
      .select(`
        id, store_id, product_id, price, notes, expires_at, created_at,
        stores!inner (id, name, retailer, address, suburb, lat, lng),
        products!inner (id, name, variant, size_ml, image_url, pack_size)
      `)
      .gte('expires_at', new Date().toISOString())
      .eq('products.variant', variant)

    if (!userPricesError && userPrices) {
      const rawPrices = userPrices as unknown as UserPriceRecord[]
      const merged = mergeUserPrices(rawPrices, lat, lng, radiusMeters)
      results.push(...merged)
    }

    // Filter by pack size AFTER all sources are merged
    const packFiltered = packSize === 'all'
      ? results
      : results.filter((p) => {
          const productPackSize = p.products?.pack_size ?? 'single'
          if (packSize === '4_pack') return productPackSize === '4_pack'
          if (packSize === 'single') return productPackSize === 'single'
          return true
        })

    const withPerCanPrice = packFiltered.map((p) => ({
      ...p,
      per_can_price: p.products?.pack_size === '4_pack'
        ? Number((Number(p.price) / 4).toFixed(2))
        : Number(p.price),
    }))

    withPerCanPrice.sort((a, b) => {
      if (sort === 'price') return Number(a.per_can_price) - Number(b.per_can_price)
      if (sort === 'distance') return a.distance - b.distance
      return a.stores.name.localeCompare(b.stores.name)
    })

    return NextResponse.json({
      prices: withPerCanPrice,
      meta: {
        total: withPerCanPrice.length,
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
