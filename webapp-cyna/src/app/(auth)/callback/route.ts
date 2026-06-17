import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-client'

export async function GET(request: Request) {
  // 1. On récupère l'URL complète cliquée par l'utilisateur
  const { searchParams, origin } = new URL(request.url)

  // 2. On extrait le code secret fourni par Supabase
  const code = searchParams.get('code')

  // 3. On extrait la page où l'utilisateur voulait aller (optionnel, par défaut /dashboard)
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createServerClient()

    // 4. On échange ce code contre une session valide (ça confirme le mail !)
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // 5. Succès ! On redirige l'utilisateur vers son espace personnel
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // 6. Si le code est invalide ou expiré, on le renvoie au login avec une erreur
  return NextResponse.redirect(`${origin}/login?error=Lien de confirmation invalide ou expiré.`)
}