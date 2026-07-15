import "server-only";

import { isActiveAdmin } from "@/lib/auth/roles";
import { createServerClient } from "@/lib/supabase/server-client";

export async function requireActiveAal2Admin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("AUTHENTICATION_REQUIRED");
  const { data: profile } = await supabase
    .from("utilisateur")
    .select("role, is_actif")
    .eq("id_compte", user.id)
    .maybeSingle();
  if (!isActiveAdmin(profile)) throw new Error("ADMIN_REQUIRED");
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") throw new Error("AAL2_REQUIRED");
  return { user };
}
