'use server'

import { redirect } from 'next/navigation'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'

// ============================================================================
// 1. CONNEXION (LOGIN)
// ============================================================================
export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: "L'email et le mot de passe sont requis." }
  }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: "Identifiants incorrects." }
  }

  // Redirection simple vers l'accueil
  redirect('/')
}

// ============================================================================
// 2. INSCRIPTION (REGISTER)
// ============================================================================
export async function register(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nomComplet = formData.get('nom_complet') as string

  if (!email || !password || !nomComplet) {
    return { error: "Tous les champs sont requis." }
  }

  const supabaseAdmin = createAdminClient()

  // 1. Création du compte en silence (sans auto-login)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (authError) {
    return { error: authError.message }
  }

  // 2. Création du profil en BDD
  if (authData.user) {
    const { error: dbError } = await supabaseAdmin
      .from('utilisateur')
      .insert({
        id_compte: authData.user.id,
        adresse_mail: email,
        nom_complet: nomComplet,
        role: 'client',
        is_actif: true,
        token_connexion_stripe: 'non_configure',
      })

    if (dbError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return { error: `Erreur base de données: ${dbError.message}` }
    }
  }

  // 3. Redirection vers la page login avec un message de succès
  const message = encodeURIComponent("Compte créé avec succès ! Veuillez vous connecter.")
  redirect(`/login?message=${message}`)



  // --- Avec Confirmation email d'inscription ---
  // on le renvoie vers la page de login 
  // avec un message dans l'URL pour lui dire d'aller lire ses mails.

  // redirect('/login?message=Inscription réussie ! Vérifiez votre boîte mail pour confirmer votre compte.')
}

// ============================================================================
// 3. DÉCONNEXION (LOGOUT)
// ============================================================================
export async function logout() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/')
}


// ============================================================================
// 4. MOT DE PASSE OUBLIÉ (Envoi de l'email)
// ============================================================================
export async function resetPassword(formData: FormData) {
  const email = formData.get('email') as string

  if (!email) {
    return { error: "L'adresse email est requise." }
  }

  const supabase = await createServerClient()

  // : On passe par le  callback/route pour créer la session depuis le code dans le lien
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/update-password`,
  })

  if (error) {
    return { error: error.message }
  }

  //  On renvoie le texte exact à afficher sur UI
  return {
    success: "Un e-mail de réinitialisation a été envoyé. Veuillez vérifier votre boîte de réception (et vos spams !)."
  }
}

// ============================================================================
// 5. MISE À JOUR DU MOT DE PASSE (Après le form)
// ============================================================================
export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!password || password !== confirmPassword) {
    return { error: "Les mots de passe ne correspondent pas ou sont vides." }
  }

  const supabase = await createServerClient()

  // Cette fonction met à jour l'utilisateur ACTUELLEMENT authentifié.
  // (Le clic sur le lien dans l'email connecte temporairement l'utilisateur 
  // pour lui permettre de changer son mot de passe).
  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    return { error: "Erreur lors de la modification du mot de passe." }
  }

  redirect('/login?message=Mot de passe mis à jour avec succès')
}