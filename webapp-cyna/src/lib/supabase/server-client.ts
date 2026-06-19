import { createServerClient as ssrCreateServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

// CLIENT : Le Serveur Utilisateur
// À utiliser dans les Server Components et Server Actions pour les clients normaux

// 1. On ajoute le paramètre avec 'true' par défaut pour ne rien casser ailleurs
export async function createServerClient(isRememberMe: boolean = true) {
    const cookieStore = await cookies()
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !anonKey) throw new Error('Variables publiques manquantes.')

    return ssrCreateServerClient<Database>(url, anonKey, {
        cookies: {
            getAll() { return cookieStore.getAll() },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        // 2. On fait une copie des options pour pouvoir les manipuler
                        const cookieOptions = { ...options };

                        // 3. LA MAGIE : Si la case n'est pas cochée, on enlève la durée de vie
                        if (!isRememberMe) {
                            delete cookieOptions.maxAge;
                            delete cookieOptions.expires;
                        }

                        // On enregistre le cookie avec nos options modifiées
                        cookieStore.set(name, value, cookieOptions);
                    })
                }
                catch { }
            },
        },
    })
}