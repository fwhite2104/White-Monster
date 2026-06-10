import { createBrowserClient as _createBrowserClient } from '@supabase/ssr'

/**
 * Browser-only Supabase client (no cookies, anonymous access only).
 * Never import this in a Server Component or API route — use
 * `createServerClient` from `@/lib/supabase/server` instead.
 */
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set. See .env.example for details.'
    )
  }

  return _createBrowserClient(url, key)
}
