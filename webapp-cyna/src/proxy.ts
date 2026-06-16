import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // 1. On crée une réponse par défaut qui dit "laisse passer la requête"
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. On initialise un client Supabase exclusif au proxy
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Si Supabase génère un nouveau token, on le met d'abord dans la requête en cours...
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))

          // ... puis on l'attache à la réponse qui sera envoyée au navigateur de l'utilisateur
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. On appelle getUser(). 
  // Même si on ne bloque personne pour l'instant, ça permet de tester que la session se rafraîchit bien.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  /* =========================================================================
     4. REDIRECTIONS SÉCURISÉES 
     -> Commentaire à enlever dès que le système de login est prêt.
     =========================================================================
  
  const url = request.nextUrl.clone()
  const isProtectedRoute = url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/admin')
  const isAuthRoute = url.pathname.startsWith('/login') || url.pathname.startsWith('/register')

  // Règle A : L'utilisateur n'est PAS connecté et veut voir une zone protégée
  if (!user && isProtectedRoute) {
    url.searchParams.set('next', url.pathname + url.search)
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Règle B : L'utilisateur EST connecté et essaie d'aller sur la page de login ou register
  if (user && isAuthRoute) {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }
  
  ========================================================================= */

  // 5. On renvoie la réponse 
  return supabaseResponse
}

// 6. Configuration de Next.js
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
