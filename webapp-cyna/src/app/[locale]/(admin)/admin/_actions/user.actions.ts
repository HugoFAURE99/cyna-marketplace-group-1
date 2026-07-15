"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { requireActiveAal2Admin } from "@/lib/auth/admin-guard";

export async function getUsers() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("utilisateur")
    .select("id_compte, adresse_mail, nom_complet, role, is_actif")
    .order("nom_complet");

  if (error) throw error;
  return data;
}

export async function toggleUserStatus(id: string, isActive: boolean) {
  await requireActiveAal2Admin();
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("utilisateur")
    .update({ is_actif: isActive })
    .eq("id_compte", id);

  if (error) throw error;
}

export async function updateUserRole(id: string, role: string) {
  await requireActiveAal2Admin();
  if (role !== "admin" && role !== "client") throw new Error("INVALID_ROLE");
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("utilisateur")
    .update({ role })
    .eq("id_compte", id);

  if (error) throw error;
}

export type UserDetail = {
  id_compte: string;
  adresse_mail: string;
  nom_complet: string;
  role: string;
  is_actif: boolean;
  adresses: {
    id_adresse: number;
    adresse: string;
    ville: string;
    code_postal: string;
    pays: string;
  }[];
  commandes: {
    id_commande: number;
    date_commande: string;
    montant_total: number;
    statut_commande: string;
  }[];
  abonnements: {
    id_abonnement: number;
    date_debut: string;
    date_fin: string | null;
    statut_abonnement: string;
  }[];
  mfa_enabled: boolean;
};

type UserSubscriptionQuery = UserDetail["abonnements"][number] & {
  commande: UserDetail["commandes"][number] | null;
  id_commande: number;
};

export async function getUserDetail(id: string): Promise<UserDetail | null> {
  const supabase = await createAdminClient();

  const { data: user, error } = await supabase
    .from("utilisateur")
    .select("id_compte, adresse_mail, nom_complet, role, is_actif")
    .eq("id_compte", id)
    .single();

  if (error || !user) return null;

  const [{ data: adresses }, { data: abonnements }] = await Promise.all([
    supabase
      .from("adresse")
      .select("id_adresse, adresse, ville, code_postal, pays")
      .eq("id_compte", id)
      .eq("is_deleted", false),
    supabase
      .from("abonnement")
      .select(
        "id_abonnement, date_debut, date_fin, statut_abonnement, id_commande, commande(id_commande, date_commande, montant_total, statut_commande)",
      )
      .eq("id_compte", id)
      .order("date_debut", { ascending: false }),
  ]);

  const subscriptionRows = (abonnements ?? []) as unknown as UserSubscriptionQuery[];
  const commandes = subscriptionRows
    .map((subscription) => subscription.commande)
    .filter((order): order is UserDetail["commandes"][number] => Boolean(order))
    .filter(
      (order, index, orders) =>
        orders.findIndex((candidate) => candidate.id_commande === order.id_commande) === index,
    );

  const { data: factorData } = await supabase.auth.admin.mfa.listFactors({ userId: id });

  return {
    ...user,
    adresses: adresses ?? [],
    commandes,
    abonnements: subscriptionRows.map(
      ({ id_abonnement, date_debut, date_fin, statut_abonnement }) => ({
        id_abonnement,
        date_debut,
        date_fin,
        statut_abonnement,
      }),
    ),
    mfa_enabled: factorData?.factors.some((factor) => factor.status === "verified") ?? false,
  };
}

export type ResetUserMfaResult =
  | { ok: true; removed: number }
  | { ok: false; error: "self_reset" | "ticket_required" | "no_factor" | "unavailable" };

export async function resetUserMfa(targetId: string, ticketId: string): Promise<ResetUserMfaResult> {
  const { user: actor } = await requireActiveAal2Admin();
  if (actor.id === targetId) return { ok: false, error: "self_reset" };
  const supabase = createAdminClient();
  const { data: ticket } = await supabase
    .from("ticket_support")
    .select("id_support")
    .eq("id_support", ticketId)
    .eq("id_compte", targetId)
    .eq("categorie", "mfa_reset")
    .not("status", "in", "(resolved,closed)")
    .maybeSingle();
  if (!ticket) return { ok: false, error: "ticket_required" };

  const { data: audit, error: auditError } = await supabase
    .from("mfa_reset_audit")
    .insert({ actor_id: actor.id, target_id: targetId, ticket_id: ticketId, status: "pending" })
    .select("id_audit")
    .single();
  if (auditError || !audit) return { ok: false, error: "unavailable" };

  const factors = await supabase.auth.admin.mfa.listFactors({ userId: targetId });
  const totpFactors = factors.data?.factors.filter((factor) => factor.factor_type === "totp") ?? [];
  if (factors.error || totpFactors.length === 0) {
    await supabase.from("mfa_reset_audit").update({ status: "failed", error_code: factors.error ? "list_failed" : "no_factor", completed_at: new Date().toISOString() }).eq("id_audit", audit.id_audit);
    return { ok: false, error: factors.error ? "unavailable" : "no_factor" };
  }

  for (const factor of totpFactors) {
    const deletion = await supabase.auth.admin.mfa.deleteFactor({ id: factor.id, userId: targetId });
    if (deletion.error) {
      await supabase.from("mfa_reset_audit").update({ status: "failed", factor_count: totpFactors.length, error_code: "delete_failed", completed_at: new Date().toISOString() }).eq("id_audit", audit.id_audit);
      return { ok: false, error: "unavailable" };
    }
  }

  const completedAt = new Date().toISOString();
  await Promise.all([
    supabase.from("mfa_reset_audit").update({ status: "completed", factor_count: totpFactors.length, completed_at: completedAt }).eq("id_audit", audit.id_audit),
    supabase.from("ticket_support").update({ status: "resolved", date_fermeture: completedAt }).eq("id_support", ticketId),
  ]);
  return { ok: true, removed: totpFactors.length };
}

export async function deleteUser(id: string) {
  const { user: actor } = await requireActiveAal2Admin();
  // Un admin ne peut pas se supprimer lui-même (sinon auto-verrouillage).
  if (actor.id === id) throw new Error("CANNOT_DELETE_SELF");

  const supabase = await createAdminClient();
  // Soft delete : on ne supprime pas la ligne. Des commandes, factures, abonnements,
  // tickets et journaux d'audit la référencent (FK sans cascade -> erreur 23503).
  // On désactive le compte et on anonymise les données personnelles ; les
  // enregistrements financiers et d'audit sont conservés (obligations comptables/RGPD).
  const { error } = await supabase
    .from("utilisateur")
    .update({
      is_actif: false,
      nom_complet: "Utilisateur supprimé",
      // adresse_mail est UNIQUE et NOT NULL : on garde une valeur unique et inutilisable.
      adresse_mail: `deleted-${id}@deleted.invalid`,
    })
    .eq("id_compte", id);

  if (error) throw error;
}
