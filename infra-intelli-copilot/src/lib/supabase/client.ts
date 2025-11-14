// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

// The createBrowserClient function is designed for use in client components.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}