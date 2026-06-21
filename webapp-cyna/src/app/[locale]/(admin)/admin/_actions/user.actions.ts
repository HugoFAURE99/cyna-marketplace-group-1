"use server";

import { createAdminClient } from "@/lib/supabase/server";

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
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("utilisateur")
    .update({ is_actif: isActive })
    .eq("id_compte", id);

  if (error) throw error;
}

export async function updateUserRole(id: string, role: string) {
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

  const commandes = (abonnements ?? [])
    .map((a: any) => a.commande)
    .filter(Boolean)
    .filter(
      (c: any, i: number, arr: any[]) =>
        arr.findIndex((x: any) => x.id_commande === c.id_commande) === i,
    );

  return {
    ...user,
    adresses: adresses ?? [],
    commandes,
    abonnements: (abonnements ?? []).map(
      ({ id_abonnement, date_debut, date_fin, statut_abonnement }: any) => ({
        id_abonnement,
        date_debut,
        date_fin,
        statut_abonnement,
      }),
    ),
  };
}

export async function deleteUser(id: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("utilisateur")
    .delete()
    .eq("id_compte", id);

  if (error) throw error;
}
