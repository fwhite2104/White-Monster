import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimitDB, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    const clientIp = getClientIp(request)
    const rateLimit = await checkRateLimitDB(`report-price:${clientIp}`, 10, 60 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many price reports. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { storeId, productId, price, notes } = body

    if (typeof storeId !== 'string' || storeId.length === 0) {
      return NextResponse.json({ error: 'Store is required.' }, { status: 400 })
    }
    if (typeof productId !== 'string' || productId.length === 0) {
      return NextResponse.json({ error: 'Product is required.' }, { status: 400 })
    }
    if (typeof price !== 'number' || price <= 0 || price > 100) {
      return NextResponse.json({ error: 'Price must be between €0.01 and €99.99.' }, { status: 400 })
    }

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, store_type')
      .eq('id', storeId)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: 'Store not found.' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('convenience_price_reports')
      .insert({
        store_id: storeId,
        product_id: productId,
        price: Math.round(price * 100) / 100,
        reporter_ip: clientIp,
        confidence: 'user_reported',
        notes: notes?.trim() ?? null,
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to submit price report.' }, { status: 500 })
    }

    return NextResponse.json({
      id: data.id,
      message: 'Price report submitted. Thank you!',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid input'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
