import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { error } = await supabase.from('products').select('id').limit(1)
  if (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: error.message },
      { status: 500 }
    )
  }
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  })
}
