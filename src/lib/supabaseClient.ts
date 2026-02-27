import { createClient } from '@supabase/supabase-js'
import type { Session, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let client: SupabaseClient | null = null

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  }
  return client
}

export async function getCurrentSession(): Promise<Session | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}
