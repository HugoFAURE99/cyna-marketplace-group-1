'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { createServerClient } from '@/lib/supabase/server-client'

// ============================================================================
// 1. CONNEXION (LOGIN)
// ============================================================================
export async function login(
  _prevState: any,
  formData: FormData
): Promise<{ error?: string; errorKey?: string } | null> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { errorKey: "errorMissingFields" };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { errorKey: "errorInvalidCredentials" };
  }

  redirect('/');
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

  if (!email || !password || !username || !confirmPassword) {
    return { errorKey: "errorMissingFields" };
  }

  if (password !== confirmPassword) {
    return { errorKey: "errorMismatch" };
  }

  /* ==========================================================================
     SÉCURITÉ MOT DE PASSE (DÉSACTIVÉ EN DEV - À RÉACTIVER EN PROD)
     ==========================================================================
  if (password.length < 8) {
    return { errorKey: "errorTooShort" };
  }
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
  if (!passwordRegex.test(password)) {
    return { errorKey: "errorComplexity" };
  }
  ========================================================================== */

  const supabaseAdmin = createAdminClient();

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
    return { error: authError.message };
  }

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
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return { error: `Erreur base de données: ${dbError.message}` };
    }
  }

  redirect(`/login?message=registerSuccess`);
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
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/update-password`,
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