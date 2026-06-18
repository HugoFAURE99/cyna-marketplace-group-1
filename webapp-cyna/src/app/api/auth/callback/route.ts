import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-client'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    // Par défaut, s'il n'y a pas de page "next", on l'envoie sur l'accueil (ou /dashboard)
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createServerClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Succès ! On redirige vers la page prévue.
            // Le middleware "next-intl" prendra le relais et ajoutera "/fr" ou "/en" tout seul !
            return NextResponse.redirect(new URL(next, request.url))
        }
    }

    // Erreur : on renvoie au login avec une clé d'erreur traduisible
    return NextResponse.redirect(new URL('/login?error=invalidLink', request.url))
}