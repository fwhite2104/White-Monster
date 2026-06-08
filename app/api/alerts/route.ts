import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { MONSTER_VARIANTS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const sessionId = request.nextUrl.searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json({ error: 'session_id is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('price_alerts')
    .select('*')
    .eq('session_id', sessionId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ alerts: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const { session_id, variant, target_price, store_id, pack_size, radius_km } = body

  if (!session_id || !variant || !target_price) {
    return NextResponse.json(
      { error: 'session_id, variant, and target_price are required' },
      { status: 400 }
    )
  }

  const validVariants = MONSTER_VARIANTS.map((v) => v.value)
  if (!validVariants.includes(variant)) {
    return NextResponse.json({ error: 'Invalid variant' }, { status: 400 })
  }

  if (typeof target_price !== 'number' || target_price <= 0 || target_price > 100) {
    return NextResponse.json({ error: 'Invalid target_price' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('price_alerts')
    .insert({
      session_id,
      variant,
      target_price,
      store_id: store_id ?? null,
      pack_size: pack_size ?? 'single',
      radius_km: radius_km ?? 10,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ alert: data }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const id = request.nextUrl.searchParams.get('id')
  const sessionId = request.nextUrl.searchParams.get('session_id')

  if (!id || !sessionId) {
    return NextResponse.json({ error: 'id and session_id are required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('price_alerts')
    .delete()
    .eq('id', id)
    .eq('session_id', sessionId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
