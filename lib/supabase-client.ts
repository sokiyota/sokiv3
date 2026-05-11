import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createSupabaseClient(url, key)
}

export const supabase = createClient()
