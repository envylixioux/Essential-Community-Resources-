import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase is read-mostly and anonymous. There is no login anywhere in this
 * app, by design: an account wall is a barrier for exactly the people this
 * exists for. The anon key below is a public, row-level-security-scoped key —
 * it is safe in the bundle and is not a secret.
 */

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let client: SupabaseClient | null = null

if (url && anonKey) {
  client = createClient(url, anonKey, {
    auth: {
      // Nothing in this app signs in. Do not let the SDK create or persist a
      // session, and do not put anything in storage that identifies a reader.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

/** Null when the app is running without database credentials. */
export const supabase = client

export const hasSupabase = client !== null
