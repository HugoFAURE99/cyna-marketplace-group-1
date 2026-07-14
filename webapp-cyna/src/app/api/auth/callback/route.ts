import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-client'
import { sanitizeAuthNext } from '@/lib/auth/mfa-return'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const locale = searchParams.get('locale') === 'en' ? 'en' : 'fr'

    const next = searchParams.get('next') ?? '/'
    const redirectPath = sanitizeAuthNext(next, locale)

    // 3. Un seul bloc pour faire l'échange et la redirection
    if (code) {
        const supabase = await createServerClient()

        // C'est ici qu'on interroge Supabase et qu'on crée la variable "error"
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return NextResponse.redirect(new URL(redirectPath, request.url))
        }
    }

    // 4. Erreur : on renvoie au login avec une clé d'erreur traduisible
    return NextResponse.redirect(new URL(`/${locale}/login?error=invalidLink`, request.url))
}
