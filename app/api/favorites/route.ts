import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const sessionId = request.nextUrl.searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json({ error: 'session_id is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('user_favorites')
    .select('*, products(*), stores(*)')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ favorites: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const { session_id, product_id, store_id, notes } = body

  if (!session_id || !product_id) {
    return NextResponse.json(
      { error: 'session_id and product_id are required' },
      { status: 400 }
    )
  }

  let existingQuery = supabase
    .from('user_favorites')
    .select('*')
    .eq('session_id', session_id)
    .eq('product_id', product_id)

  if (store_id == null) {
    existingQuery = existingQuery.is('store_id', null)
  } else {
    existingQuery = existingQuery.eq('store_id', store_id)
  }

  const { data: existing, error: existingError } = await existingQuery.single()

  if (existingError && existingError.code !== 'PGRST116') {
    return NextResponse.json({ error: existingError.message }, { status: 500 })
  }

  if (existing) {
    return NextResponse.json({ favorite: existing }, { status: 200 })
  }

  const { data, error } = await supabase
    .from('user_favorites')
    .insert({
      session_id,
      product_id,
      store_id: store_id ?? null,
      notes: notes ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ favorite: data }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const id = request.nextUrl.searchParams.get('id')
  const sessionId = request.nextUrl.searchParams.get('session_id')
  const productId = request.nextUrl.searchParams.get('product_id')

  if (!sessionId) {
    return NextResponse.json({ error: 'session_id is required' }, { status: 400 })
  }

  let query = supabase.from('user_favorites').delete().eq('session_id', sessionId)

  if (id) {
    query = query.eq('id', id)
  } else if (productId) {
    query = query.eq('product_id', productId)
  } else {
    return NextResponse.json({ error: 'id or product_id is required' }, { status: 400 })
  }

  const { error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
