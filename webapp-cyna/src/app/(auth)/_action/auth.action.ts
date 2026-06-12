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

  // Supabase vérifie les identifiants et génère automatiquement le cookie
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: "Identifiants incorrects." }
  }

  // Si tout est bon, on redirige vers le dashboard (compte utilisateur)
  redirect('/dashboard')
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

  const supabase = await createServerClient()
  const supabaseAdmin = createAdminClient()

  // Étape A : On crée le compte sécurisé dans le système Auth de Supabase
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    return { error: authError.message }
  }

  // Étape B : Si le compte Auth est bien créé, on l'ajoute dans la table "utilisateur"
  if (authData.user) {
    const { error: dbError } = await supabaseAdmin
      .from('utilisateur')
      .insert({
        id_compte: authData.user.id, // L'ID généré par Supabase Auth
        adresse_mail: email,
        nom_complet: nomComplet,
        role: 'client', // Rôle par défaut
        is_actif: true,
        // cette colonne est obligatoire (et n'a pas de default) :
        token_connexion_stripe: 'non_configure', 
      })

    if (dbError) {
      // En cas d'erreur BDD, on pourrait annuler la création Auth, avec un trigger dasn la BDD 
      // mais on renvoie déjà l'erreur pour comprendre ce qui cloche.
      return { error: `Erreur création profil: ${dbError.message}` }
    }
  }

  // Redirection après succès (si Supabase n'exige pas de confirmation par email)
  redirect('/dashboard')

  // --- Avec Confirmation email d'inscription ---
  // Au lieu d'aller sur le dashboard, on le renvoie vers la page de login 
  // avec un message dans l'URL pour lui dire d'aller lire ses mails.

  // redirect('/login?message=Inscription réussie ! Vérifiez votre boîte mail pour confirmer votre compte.')
}

// ============================================================================
// 3. DÉCONNEXION (LOGOUT)
// ============================================================================
export async function logout() {
  const supabase = await createServerClient()
  
  // Détruit la session et le cookie
  await supabase.auth.signOut()
  
  // Renvoie vers la page de connexion
  redirect('/login')
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
  
    // On demande à Supabase d'envoyer l'email de réinitialisation.
    // redirectTo est CRUCIAL : c'est la page sur laquelle l'utilisateur va atterrir
    // après avoir cliqué sur le lien dans son email.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/update-password`,
    })
  
    if (error) {
      return { error: error.message }
    }
  
    // On ne redirige pas, on renvoie juste un succès pour afficher un message
    // du type "Vérifiez votre boîte mail" sur ton formulaire.
    return { success: true }
  }
  
  // ============================================================================
  // 5. MISE À JOUR DU MOT DE PASSE (Après clic sur le lien)
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