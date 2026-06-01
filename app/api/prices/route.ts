import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { calculateDistance } from '@/lib/geo'
import { CORK_CENTER, DEFAULT_RADIUS_KM } from '@/lib/constants'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const searchParams = request.nextUrl.searchParams

  const lat = parseFloat(searchParams.get('lat') ?? String(CORK_CENTER.lat))
  const lng = parseFloat(searchParams.get('lng') ?? String(CORK_CENTER.lng))
  const radiusKm = parseFloat(searchParams.get('radius') ?? String(DEFAULT_RADIUS_KM))
  const variant = searchParams.get('variant') ?? 'zero_sugar'
  const sort = searchParams.get('sort') ?? 'price'
  const packSize = searchParams.get('pack_size') ?? 'all'

  const { data: prices, error } = await supabase
    .from('prices')
    .select(`
      id, store_id, product_id, price, source, scraped_at,
      stores (id, name, retailer, address, suburb, lat, lng),
      products (id, name, variant, size_ml, image_url, pack_size)
    `)
    .eq('products.variant', variant)
    .eq('stores.is_active', true)
    .order('scraped_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const radiusMeters = radiusKm * 1000
  let filtered = prices
    ?.map((p: any) => ({
      ...p,
      distance: calculateDistance(lat, lng, p.stores.lat, p.stores.lng),
    }))
    .filter((p: any) => p.distance <= radiusMeters)

  if (packSize !== 'all') {
    filtered = filtered?.filter((p: any) => {
      const productPackSize = p.products?.pack_size ?? 'single'
      if (packSize === '4_pack') return productPackSize === '4_pack'
      if (packSize === 'single') return productPackSize === 'single'
      return true
    })
  }

  filtered = filtered?.sort((a: any, b: any) => {
    if (sort === 'price') return Number(a.price) - Number(b.price)
    if (sort === 'distance') return a.distance - b.distance
    return a.stores.name.localeCompare(b.stores.name)
  })

  return NextResponse.json({
    prices: filtered,
      meta: {
        total: filtered?.length ?? 0,
        radius: radiusKm,
        variant,
        pack_size: packSize,
        center: { lat, lng },
        sort,
      },
  })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { storeName, retailer, address, lat, lng, productName, price, notes } = body

    if (!storeName || lat == null || lng == null || !productName || price == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (price < 1 || price > 50) {
      return NextResponse.json(
        { error: 'Price must be between \u20ac1 and \u20ac50' },
        { status: 400 }
      )
    }

    const { data: existingStore, error: findStoreError } = await supabase
      .from('stores')
      .select('id')
      .eq('name', storeName)
      .eq('lat', lat)
      .eq('lng', lng)
      .single()

    if (findStoreError && findStoreError.code !== 'PGRST116') {
      return NextResponse.json({ error: findStoreError.message }, { status: 500 })
    }

    let storeId = existingStore?.id
    if (!storeId) {
      const { data: newStore, error: storeError } = await supabase
        .from('stores')
        .insert({
          name: storeName,
          retailer: retailer ?? 'other',
          lat,
          lng,
          address,
        })
        .select('id')
        .single()
      if (storeError) {
        return NextResponse.json({ error: storeError.message }, { status: 500 })
      }
      storeId = newStore?.id
    }

    if (!storeId) {
      return NextResponse.json({ error: 'Failed to create store' }, { status: 500 })
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .ilike('name', `%${productName}%`)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('prices')
      .insert({
        store_id: storeId,
        product_id: product.id,
        price,
        source: 'user_upload',
        notes,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
