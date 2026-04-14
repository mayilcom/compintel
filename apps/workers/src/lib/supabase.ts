import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

// Single service-role client — bypasses RLS for all workers.
// Workers never use the anon key.
export const db: SupabaseClient = createClient(url, key, {
  auth: { persistSession: false },
})
