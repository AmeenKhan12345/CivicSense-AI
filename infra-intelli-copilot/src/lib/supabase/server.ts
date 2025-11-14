// src/lib/supabase/server.ts
import { createClient } from '@supabase/supabase-js'

// This client is a singleton and should only be used on the server.
// It uses the SERVICE_ROLE_KEY to bypass RLS.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPA_SERVICE_KEY! // Notice NO "NEXT_PUBLIC_"
)