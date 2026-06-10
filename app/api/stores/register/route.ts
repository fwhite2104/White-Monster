import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimitDB, getClientIp } from '@/lib/rate-limit'
import { validateLat, validateLng } from '@/lib/validate'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()

  try {
    const clientIp = getClientIp(request)
    const rateLimit = await checkRateLimitDB(`store-register:${clientIp}`, 5, 60 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { name, retailer, address, suburb, lat, lng, storeType } = body

    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Store name is required.' }, { status: 400 })
    }
    if (typeof retailer !== 'string' || retailer.trim().length === 0) {
      return NextResponse.json({ error: 'Retailer is required.' }, { status: 400 })
    }
    if (typeof address !== 'string' || address.trim().length === 0) {
      return NextResponse.json({ error: 'Address is required.' }, { status: 400 })
    }

    const validatedLat = validateLat(lat)
    const validatedLng = validateLng(lng)

    const validStoreTypes = ['supermarket', 'convenience', 'petrol_station', 'other']
    const resolvedStoreType = validStoreTypes.includes(storeType) ? storeType : 'convenience'

    const { data, error } = await supabase
      .from('store_registration_requests')
      .insert({
        name: name.trim(),
        retailer: retailer.trim(),
        address: address.trim(),
        suburb: suburb?.trim() ?? null,
        lat: validatedLat,
        lng: validatedLng,
        store_type: resolvedStoreType,
        reporter_ip: clientIp,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to submit registration.' }, { status: 500 })
    }

    return NextResponse.json({
      id: data.id,
      message: 'Store registration submitted for review.',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid input'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
