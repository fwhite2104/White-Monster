import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { calculateDistance } from '@/lib/geo'
import { CORK_CENTER } from '@/lib/constants'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const searchParams = request.nextUrl.searchParams
  const retailer = searchParams.get('retailer')
  const lat = parseFloat(searchParams.get('lat') ?? String(CORK_CENTER.lat))
  const lng = parseFloat(searchParams.get('lng') ?? String(CORK_CENTER.lng))
  const radiusKm = parseFloat(searchParams.get('radius') ?? '50')

  let query = supabase.from('stores').select('*').eq('is_active', true)
  if (retailer) query = query.eq('retailer', retailer)

  const { data: stores, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const radiusMeters = radiusKm * 1000
  const withDistance = stores
    ?.map((s: any) => ({
      ...s,
      distance: calculateDistance(lat, lng, s.lat, s.lng),
    }))
    .filter((s: any) => s.distance <= radiusMeters)
    .sort((a: any, b: any) => a.distance - b.distance)

  return NextResponse.json({ stores: withDistance })
}
