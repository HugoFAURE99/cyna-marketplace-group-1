'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { createServerClient } from '@/lib/supabase/server-client'

// ============================================================================
// 1. CONNEXION (LOGIN)
// ============================================================================
export async function login(
  next: string,       // <-- 1. Reçu en premier argument grâce au .bind() !
  _prevState: any,    // <-- 2. L'état précédent passe en deuxième position
  formData: FormData  // <-- 3. Les données du formulaire en troisième position
): Promise<{ error?: string; errorKey?: string } | null> {

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { errorKey: "errorMissingFields" };
  }

  const supabase = await createServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Gestion des erreurs spécifiques
    if (error.message.includes("Email not confirmed")) {
      return { errorKey: "errorUnconfirmed" };
    }
    if (error.message.includes("Invalid login credentials")) {
      return { errorKey: "errorInvalidCredentials" };
    }
    return { error: error.message };
  }

  // Sécurité Anti Open-Redirect
  const isSafeRedirect = next.startsWith('/') && !next.startsWith('//');
  const redirectPath = isSafeRedirect ? next : '/';

  // Redirection magique au bon endroit !
  redirect(redirectPath);
}

// ============================================================================
// 2. INSCRIPTION (REGISTER)
// ============================================================================
export async function register(
  _prevState: any,
  formData: FormData
): Promise<{ error?: string; errorKey?: string } | null> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const username = formData.get('username') as string;

  // 1. Vérification des champs vides
  if (!email || !password || !username || !confirmPassword) {
    return { errorKey: "errorMissingFields" };
  }

  // 2. Vérification de correspondance des mots de passe
  if (password !== confirmPassword) {
    return { errorKey: "errorMismatch" };
  }

  /* ==========================================================================
     SÉCURITÉ MOT DE PASSE (DÉSACTIVÉ EN DEV - À RÉACTIVER EN PROD)
     ==========================================================================

  // 3. Vérification de la longueur minimale (8 caractères)
  if (password.length < 8) {
    return { errorKey: "errorTooShort" };
  }

  // 4. Vérification de la complexité (Majuscule, minuscule, chiffre, caractère spécial)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
  if (!passwordRegex.test(password)) {
    return { errorKey: "errorComplexity" };
  }
  ========================================================================== */

  // On crée les deux clients
  const supabase = await createServerClient(); // Pour l'inscription (déclenche l'email)
  const supabaseAdmin = createAdminClient();   // Pour forcer l'écriture en BDD

  const { data: existingUser } = await supabaseAdmin
    .from('utilisateur')
    .select('adresse_mail')
    .eq('adresse_mail', email)
    .maybeSingle(); // maybeSingle() évite de lever une erreur si on ne trouve rien

  if (existingUser) {
    // L'email existe déjà, on coupe tout et on renvoie notre nouvelle erreur
    return { errorKey: "errorEmailTaken" };
  }

  // 5. Création du compte (C'est ça qui envoie l'e-mail de confirmation)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      //l'URL où Supabase redirige après le clic sur l'e-mail
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
    }
  });

  if (authError) {
    // Erreur provenant de Supabase (ex: email déjà pris)
    return { error: authError.message };
  }

  // 6. Création du profil en BDD (Toujours avec Admin pour contourner RLS)
  if (authData.user) {
    const { error: dbError } = await supabaseAdmin
      .from('utilisateur')
      .insert({
        id_compte: authData.user.id,
        adresse_mail: email,
        nom_complet: username,
        role: 'client',
        is_actif: true,
        token_connexion_stripe: 'non_configure',
      });

    if (dbError) {
      // En cas d'erreur BDD, on supprime le compte Auth pour garder la cohérence
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return { error: `Erreur base de données: ${dbError.message}` };
    }
  }

  // 7. Redirection vers la page login avec un message indiquant d'aller voir ses e-mails
  redirect(`/login?message=checkEmail`);
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
export async function resetPassword(
  _prevState: any,
  formData: FormData
): Promise<{ error?: string; errorKey?: string; successKey?: string } | null> {
  const email = formData.get('email') as string

  if (!email) {
    return { errorKey: "errorMissingFields" }
  }

  const supabase = await createServerClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback?next=/update-password`,
  })

  if (error) {
    return { error: error.message }
  }

  // Renvoie une clé de succès pour l'afficher en vert sur le composant
  return { successKey: "resetEmailSent" }
}

// ============================================================================
// 5. MISE À JOUR DU MOT DE PASSE (Après le form)
// ============================================================================
export async function updatePassword(
  _prevState: any,
  formData: FormData
): Promise<{ error?: string; errorKey?: string } | null> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string // J'ai camelCase pour matcher ton registerForm

  if (!password || !confirmPassword) {
    return { errorKey: "errorMissingFields" }
  }

  if (password !== confirmPassword) {
    return { errorKey: "errorMismatch" }
  }

  const supabase = await createServerClient()

  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    return { errorKey: "errorUpdateFailed" }
  }

  // Redirection avec une clé traduisible
  redirect('/login?message=updatePasswordSuccess')
}