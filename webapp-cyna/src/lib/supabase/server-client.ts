import { createServerClient as ssrCreateServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

// CLIENT : Le Serveur Utilisateur
// À utiliser dans les Server Components et Server Actions pour les clients normaux
export async function createServerClient() {
    const cookieStore = await cookies()
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !anonKey) throw new Error('Variables publiques manquantes.')

    return ssrCreateServerClient<Database>(url, anonKey, {
        cookies: {
            getAll() { return cookieStore.getAll() },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    )
                }
                catch { }
            },
        },
    })
}