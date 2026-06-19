import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-client'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    // 1. On récupère le next (par défaut l'accueil)
    const next = searchParams.get('next') ?? '/'

    // 2. SÉCURITÉ : Anti "Open-Redirect" 
    // On s'assure que c'est bien une route interne (commence par / et pas par //)
    const isSafeRedirect = next.startsWith('/') && !next.startsWith('//')
    const redirectPath = isSafeRedirect ? next : '/'

    // 3. Un seul bloc pour faire l'échange et la redirection
    if (code) {
        const supabase = await createServerClient()

        // C'est ici qu'on interroge Supabase et qu'on crée la variable "error"
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            //  On redirige vers le chemin sécurisé
            return NextResponse.redirect(new URL(redirectPath, request.url))
        }
    }

    // 4. Erreur : on renvoie au login avec une clé d'erreur traduisible
    return NextResponse.redirect(new URL('/login?error=invalidLink', request.url))
}