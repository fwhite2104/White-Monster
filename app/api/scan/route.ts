import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimitDB, getClientIp } from '@/lib/rate-limit'
import { validateLat, validateLng, validateRadius } from '@/lib/validate'
import { CORK_CENTER, DEFAULT_RADIUS_KM } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
  const supabase = await createServerClient()

  const clientIp = getClientIp(request)
  const rateLimit = await checkRateLimitDB(`scan:${clientIp}`, 20, 60 * 1000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429 }
    )
  }

  const barcode = request.nextUrl.searchParams.get('barcode')
  const latParam = request.nextUrl.searchParams.get('lat')
  const lngParam = request.nextUrl.searchParams.get('lng')
  const radiusParam = request.nextUrl.searchParams.get('radius')

  if (!barcode) {
    return NextResponse.json({ error: 'barcode is required' }, { status: 400 })
  }

  let lat: number
  let lng: number
  let radius: number
  try {
    lat = latParam != null ? validateLat(latParam) : CORK_CENTER.lat
    lng = lngParam != null ? validateLng(lngParam) : CORK_CENTER.lng
    radius = radiusParam != null ? validateRadius(radiusParam) : DEFAULT_RADIUS_KM
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid parameters'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  // 1. Look up product by barcode
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode)
    .eq('is_active', true)
    .single()

  if (productError || !product) {
    return NextResponse.json({
      found: false,
      barcode,
      message: 'This product is not currently tracked by Monster Cork.',
      suggestion: 'You can report this product through the app to help us add it.',
    })
  }

  // 2. Get nearby prices for this product using PostGIS RPC
  const { data: prices, error: priceError } = await supabase.rpc('nearby_prices', {
    p_user_lat: lat,
    p_user_lng: lng,
    p_radius_meters: radius * 1000,
    p_variant_filter: product.variant,
    p_sort_by: 'price',
    p_pack_size_filter: 'all',
  })

  if (priceError) {
    // Fallback: direct query without PostGIS
    const { data: fallbackPrices } = await supabase
      .from('prices')
      .select('*, stores(*), products(*)')
      .eq('product_id', product.id)
      .eq('products.variant', product.variant)
      .order('price', { ascending: true })

    return NextResponse.json({
      found: true,
      product,
      prices: fallbackPrices ?? [],
      method: 'direct',
    })
  }

  return NextResponse.json({
    found: true,
    product,
    prices: prices ?? [],
    method: 'postgis',
  })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
