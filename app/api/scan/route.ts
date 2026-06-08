import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const barcode = request.nextUrl.searchParams.get('barcode')
  const lat = parseFloat(request.nextUrl.searchParams.get('lat') ?? '51.8985')
  const lng = parseFloat(request.nextUrl.searchParams.get('lng') ?? '-8.4756')
  const radius = parseFloat(request.nextUrl.searchParams.get('radius') ?? '10')

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
    user_lat: lat,
    user_lng: lng,
    radius_km: radius,
    product_variant: product.variant,
  })

  if (priceError) {
    // Fallback: direct query without PostGIS
    const { data: fallbackPrices } = await supabase
      .from('prices')
      .select('*, stores(*), products(*)')
      .eq('product_id', product.id)
      .order('price', { ascending: true })

    return NextResponse.json({
      found: true,
      product,
      prices: fallbackPrices ?? [],
      method: 'direct',
    })
  }

  // Filter prices for the scanned product
  const productPrices = (prices ?? []).filter(
    (p: { product_id?: string; products?: { id?: string } }) =>
      p.product_id === product.id || p.products?.id === product.id
  )

  return NextResponse.json({
    found: true,
    product,
    prices: productPrices,
    method: 'postgis',
  })
}
