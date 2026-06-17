import { createBrowserClient as ssrCreateBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

// CLIENT : Le Navigateur
// À utiliser UNIQUEMENT entre le navigateur avec la BDD
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) throw new Error('Variables publiques manquantes.')

  return ssrCreateBrowserClient<Database>(url, anonKey)
}