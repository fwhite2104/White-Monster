import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { calculateDistance } from '@/lib/geo'
import {
  CORK_CENTER,
  DEFAULT_RADIUS_KM,
  RETAILERS,
} from '@/lib/constants'
import { validateLat, validateLng, validateRadius, validateEnum } from '@/lib/validate'
import type { Store } from '@/lib/types'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const searchParams = request.nextUrl.searchParams

  try {
    const clientIp = getClientIp(request)
    const rateLimit = checkRateLimit(`stores-fetch:${clientIp}`, 60, 60 * 1000)
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

    const retailerParam = searchParams.get('retailer')
    const retailer = retailerParam !== null
      ? validateEnum(retailerParam, 'retailer', RETAILERS.map((r) => r.value))
      : undefined

    let query = supabase.from('stores').select('*').eq('is_active', true)
    if (retailer) query = query.eq('retailer', retailer)

    const { data: stores, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const radiusMeters = radiusKm * 1000
    const typedStores = (stores ?? []) as Store[]
    const withDistance = typedStores
      .filter((s) => !s.name.includes('(National)'))
      .map((s) => ({
        ...s,
        distance: calculateDistance(lat, lng, s.lat, s.lng),
      }))
      .filter((s) => s.distance <= radiusMeters)
      .sort((a, b) => a.distance - b.distance)

    return NextResponse.json({ stores: withDistance })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid input'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}