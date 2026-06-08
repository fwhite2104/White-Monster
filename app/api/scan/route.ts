import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimitDB, getClientIp } from '@/lib/rate-limit'
import { validateLat, validateLng } from '@/lib/validate'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

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

  const lat = latParam != null ? validateLat(latParam) : 51.8985
  const lng = lngParam != null ? validateLng(lngParam) : -8.4756
  const radius = radiusParam != null ? parseFloat(radiusParam) : 10

  if (!barcode) {
    return NextResponse.json({ error: 'barcode is required' }, { status: 400 })
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
}
