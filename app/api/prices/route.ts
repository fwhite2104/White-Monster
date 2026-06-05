import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimitDB, getClientIp } from '@/lib/rate-limit'
import { calculateDistance } from '@/lib/geo'
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

interface StoreData {
  id: string
  name: string
  retailer: string
  address: string
  suburb: string
  lat: number
  lng: number
}

interface ProductData {
  id: string
  name: string
  variant: string
  size_ml: number
  image_url: string
  pack_size: string
}

interface PriceWithJoins {
  id: string
  store_id: string
  product_id: string
  price: number
  source: string
  scraped_at: string
  stores: StoreData
  products: ProductData
}

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

    const { data: prices, error } = await supabase
      .from('prices')
      .select(`
        id, store_id, product_id, price, source, scraped_at,
        stores!inner (id, name, retailer, address, suburb, lat, lng),
        products!inner (id, name, variant, size_ml, image_url, pack_size)
      `)
      .eq('products.variant', variant)
      .eq('stores.is_active', true)
      .order('scraped_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const allPrices = (prices ?? []) as unknown as PriceWithJoins[]
    const typed = allPrices.filter((p) => p.stores != null && p.products != null)

    const radiusMeters = radiusKm * 1000

    type PriceEntry = PriceWithJoins & { distance: number }

    const nationalPrices = typed.filter((p) => p.stores.name.includes('(National)'))
    const physicalPrices = typed.filter((p) => !p.stores.name.includes('(National)'))

    const results: PriceEntry[] = []

    for (const p of physicalPrices) {
      if (!Number.isFinite(p.stores.lat) || !Number.isFinite(p.stores.lng)) continue
      const dist = calculateDistance(lat, lng, p.stores.lat, p.stores.lng)
      if (dist <= radiusMeters) {
        results.push({ ...p, distance: dist })
      }
    }

    const seenStoreProduct = new Set<string>()
    for (const p of results) {
      seenStoreProduct.add(`${p.stores.id}|${p.product_id}`)
    }

    if (nationalPrices.length > 0) {
      const { data: allStores, error: storesError } = await supabase
        .from('stores')
        .select('id, name, retailer, address, suburb, lat, lng')
        .eq('is_active', true)

      if (!storesError && allStores) {
        const validStores = allStores.filter(
          (s) => Number.isFinite(s.lat) && Number.isFinite(s.lng)
            && s.lat >= -90 && s.lat <= 90
            && s.lng >= -180 && s.lng <= 180
        )
        const physicalStores = validStores.filter((s) => !s.name.includes('(National)'))
        const nationalStores = validStores.filter((s) => s.name.includes('(National)'))

        const storeByRetailer = new Map<string, typeof physicalStores>()
        for (const s of physicalStores) {
          const list = storeByRetailer.get(s.retailer) ?? []
          list.push(s)
          storeByRetailer.set(s.retailer, list)
        }

        const nationalByRetailer = new Map<string, PriceWithJoins[]>()
        for (const p of nationalPrices) {
          const list = nationalByRetailer.get(p.stores.retailer) ?? []
          list.push(p)
          nationalByRetailer.set(p.stores.retailer, list)
        }

        for (const [retailer, nPrices] of nationalByRetailer) {
          const retailerStores = (storeByRetailer.get(retailer) ?? [])
            .filter((s) => calculateDistance(lat, lng, s.lat, s.lng) <= radiusMeters)

          let storesToUse = retailerStores

          if (storesToUse.length === 0) {
            const allRetailerStores = storeByRetailer.get(retailer) ?? []
            if (allRetailerStores.length === 0) continue

            const closest = allRetailerStores.reduce((best, s) => {
              const d = calculateDistance(lat, lng, s.lat, s.lng)
              const bd = calculateDistance(lat, lng, best.lat, best.lng)
              return d < bd ? s : best
            })
            storesToUse = [closest]
          }

          for (const store of storesToUse) {
            for (const np of nPrices) {
              const key = `${store.id}|${np.product_id}`
              if (seenStoreProduct.has(key)) continue
              seenStoreProduct.add(key)

              const dist = calculateDistance(lat, lng, store.lat, store.lng)
              results.push({
                ...np,
                store_id: store.id,
                stores: {
                  id: store.id,
                  name: store.name,
                  retailer: store.retailer,
                  address: store.address ?? '',
                  suburb: store.suburb ?? '',
                  lat: store.lat,
                  lng: store.lng,
                },
                distance: dist,
              })
            }
          }
        }
      }
    }

    // Fetch non-expired user-reported prices for the same variant
    const { data: userPrices, error: userPricesError } = await supabase
      .from('user_prices')
      .select(`
        id, store_id, product_id, price, uploaded_by_ip, notes, expires_at, created_at,
        stores!inner (id, name, retailer, address, suburb, lat, lng),
        products!inner (id, name, variant, size_ml, image_url, pack_size)
      `)
      .gte('expires_at', new Date().toISOString())
      .eq('products.variant', variant)

    if (!userPricesError && userPrices) {
      const rawPrices = userPrices as unknown as Array<{
        id: string
        store_id: string
        product_id: string
        price: number
        uploaded_by_ip: string | null
        notes: string | null
        expires_at: string
        created_at: string
        stores: { id: string; name: string; retailer: string; address: string; suburb: string; lat: number; lng: number }
        products: { id: string; name: string; variant: string; size_ml: number; image_url: string; pack_size: string }
      }>

      // Filter by distance to user
      const nearbyUserPrices = rawPrices.filter((up) => {
        const s = up.stores
        if (!s || !Number.isFinite(s.lat) || !Number.isFinite(s.lng)) return false
        const dist = calculateDistance(lat, lng, s.lat, s.lng)
        return dist <= radiusMeters
      })

      // Aggregate by (retailer, variant, pack_size): lowest price, most recent as tiebreaker
      const bestByRetailer = new Map<string, typeof rawPrices[0]>()
      for (const up of nearbyUserPrices) {
        const key = `${up.stores.retailer}|${up.products.variant}|${up.products.pack_size}`
        const existing = bestByRetailer.get(key)
        if (
          !existing ||
          Number(up.price) < Number(existing.price) ||
          (Number(up.price) === Number(existing.price) && new Date(up.created_at) > new Date(existing.created_at))
        ) {
          bestByRetailer.set(key, up)
        }
      }

      // Add best user-reported prices as entries
      for (const up of bestByRetailer.values()) {
        const dist = calculateDistance(lat, lng, up.stores.lat, up.stores.lng)
        const entry: PriceEntry = {
          id: up.id,
          store_id: up.store_id,
          product_id: up.product_id,
          price: Number(up.price),
          source: 'user_reported',
          scraped_at: up.created_at,
          stores: up.stores,
          products: up.products,
          distance: dist,
        }
        results.push(entry)
      }
    }

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
        id, store_id, product_id, price, uploaded_by_ip, notes, expires_at, created_at,
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
