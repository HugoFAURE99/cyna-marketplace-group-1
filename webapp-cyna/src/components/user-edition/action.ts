'use server'

import { createServerClient } from '@/lib/supabase/server-client'
import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type ActionState = {
  errorKey?: string;
  successKey?: string;
  rawError?: string;
};

export async function updateEmail(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState | null> {
  const email = formData.get('email') as string;

  if (!email) {
    return { errorKey: "errorMissingFields" };
  }

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { errorKey: "errorUpdateFailed" };
  }

  const { error } = await supabase.auth.updateUser({ email });

  if (error) {
    return { errorKey: "errorUpdateFailed" };
  }

  // Also update 'utilisateur' table for consistency
  const supabaseAdmin = createAdminClient();
  await supabaseAdmin
    .from('utilisateur')
    .update({ adresse_mail: email })
    .eq('id_compte', user.id);

  // Update 'commande' table so they don't lose their past orders
  if (user.email) {
    await supabaseAdmin
      .from('commande')
      .update({ mail_utilisateur_invite: email })
      .eq('mail_utilisateur_invite', user.email);
  }

  revalidatePath('/user-dashboard/user-edition');
  revalidatePath('/user-dashboard/infos'); // Just in case it's shown there
  revalidatePath('/user-dashboard/orders');
  revalidatePath('/user-dashboard/billing');

  return { successKey: "successEmailUpdate" };
}

export async function updateDashboardPassword(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState | null> {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('password_confirm') as string;

  if (!password || !confirmPassword) {
    return { errorKey: "errorMissingFields" };
  }

  if (password !== confirmPassword) {
    return { errorKey: "errorMismatch" };
  }

  const supabase = await createServerClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { errorKey: "errorUpdateFailed" };
  }

  return { successKey: "successPasswordUpdate" };
}

export async function requestPasswordResetEmail(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState | null> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { errorKey: "errorUpdateFailed" };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback?next=/user-dashboard/update-password`,
  });

  if (error) {
    console.error("Supabase Reset Password Error:", error);
    return { errorKey: "errorUpdateFailed", rawError: error.message };
  }

  return { successKey: "successResetEmailSent" };
}
