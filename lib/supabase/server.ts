import { createServerClient as _createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server-only Supabase client (uses Next.js cookies, respects RLS via session).
 * Never import this in a Client Component — use `createBrowserClient` from
 * `@/lib/supabase/client` instead. Importing the wrong client leaks server
 * cookies into the browser bundle.
 */
export async function createServerClient() {
  const cookieStore = await cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set. See .env.example for details.'
    )
  }

  return _createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This is handled by middleware.ts which refreshes sessions.
          }
        },
      },
    }
  )
}
