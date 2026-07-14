"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { requireActiveAal2Admin } from "@/lib/auth/admin-guard";

export type SubscriptionRow = {
  id_abonnement: number;
  date_debut: string;
  date_fin: string | null;
  statut_abonnement: string;
  stripe_subscription_id: string | null;
  client_name: string | null;
  client_email: string;
  produit_nom: string;
  type_facturation: string;
  prix: number;
  id_commande: number;
};

export type SubscriptionDetail = SubscriptionRow & {
  commande: {
    id_commande: number;
    date_commande: string;
    montant_total: number;
    statut_commande: string;
  } | null;
};

type SubscriptionQueryRow = {
  commande: { mail_utilisateur_invite: string | null } | null;
  date_debut: string;
  date_fin: string | null;
  id_abonnement: number;
  id_commande: number;
  id_compte: string | null;
  prix_tarif: {
    prix: number;
    produit: { produit_traduction: { langue: string; nom_pro: string }[] | null } | null;
    type_facturation: string;
  } | null;
  statut_abonnement: string;
  stripe_subscription_id: string | null;
};

export async function getSubscriptions(): Promise<SubscriptionRow[]> {
  const supabase = await createAdminClient();

  const { data: abonnements, error } = await supabase
    .from("abonnement")
    .select(`
      id_abonnement,
      date_debut,
      date_fin,
      statut_abonnement,
      stripe_subscription_id,
      id_commande,
      id_compte,
      id_prix,
      commande (mail_utilisateur_invite),
      prix_tarif (
        prix,
        type_facturation,
        produit (
          produit_traduction (
            nom_pro,
            langue
          )
        )
      )
    `)
    .order("date_debut", { ascending: false });

  if (error || !abonnements) return [];

  const subscriptionRows = abonnements as unknown as SubscriptionQueryRow[];
  const compteIds = [
    ...new Set(
      subscriptionRows
        .map((subscription) => subscription.id_compte)
        .filter(Boolean) as string[]
    ),
  ];

  const userMap = new Map<string, { nom_complet: string; adresse_mail: string }>();

  if (compteIds.length > 0) {
    const { data: users } = await supabase
      .from("utilisateur")
      .select("id_compte, nom_complet, adresse_mail")
      .in("id_compte", compteIds);

    for (const u of users ?? []) {
      userMap.set(u.id_compte, {
        nom_complet: u.nom_complet,
        adresse_mail: u.adresse_mail,
      });
    }
  }

  return subscriptionRows.map((a) => {
    const user = a.id_compte ? userMap.get(a.id_compte) : null;
    const pt = a.prix_tarif;
    const traductions = pt?.produit?.produit_traduction;
    const frName =
      traductions?.find((translation) => translation.langue === "fr")?.nom_pro || "—";

    return {
      id_abonnement: a.id_abonnement,
      date_debut: a.date_debut,
      date_fin: a.date_fin,
      statut_abonnement: a.statut_abonnement,
      stripe_subscription_id: a.stripe_subscription_id,
      client_name: user?.nom_complet || null,
      client_email: user?.adresse_mail || a.commande?.mail_utilisateur_invite || "—",
      produit_nom: frName,
      type_facturation: pt?.type_facturation || "—",
      prix: pt?.prix || 0,
      id_commande: a.id_commande,
    };
  });
}

export async function getSubscriptionDetail(
  id: number
): Promise<SubscriptionDetail | null> {
  const supabase = await createAdminClient();

  const { data: abonnement, error } = await supabase
    .from("abonnement")
    .select(`
      id_abonnement,
      date_debut,
      date_fin,
      statut_abonnement,
      stripe_subscription_id,
      id_commande,
      id_compte,
      id_prix,
      commande (mail_utilisateur_invite),
      prix_tarif (
        prix,
        type_facturation,
        produit (
          produit_traduction (
            nom_pro,
            langue
          )
        )
      )
    `)
    .eq("id_abonnement", id)
    .single();

  if (error || !abonnement) return null;

  const a = abonnement as unknown as SubscriptionQueryRow;

  let client_email = a.commande?.mail_utilisateur_invite || "—";
  let client_name: string | null = null;

  if (a.id_compte) {
    const { data: user } = await supabase
      .from("utilisateur")
      .select("nom_complet, adresse_mail")
      .eq("id_compte", a.id_compte)
      .single();

    if (user) {
      client_email = user.adresse_mail;
      client_name = user.nom_complet;
    }
  }

  const pt = a.prix_tarif;
  const traductions = pt?.produit?.produit_traduction;
  const frName =
    traductions?.find((translation) => translation.langue === "fr")?.nom_pro || "—";

  let commande: SubscriptionDetail["commande"] = null;
  if (a.id_commande) {
    const { data: cmd } = await supabase
      .from("commande")
      .select("id_commande, date_commande, montant_total, statut_commande")
      .eq("id_commande", a.id_commande)
      .single();

    if (cmd) commande = cmd;
  }

  return {
    id_abonnement: a.id_abonnement,
    date_debut: a.date_debut,
    date_fin: a.date_fin,
    statut_abonnement: a.statut_abonnement,
    stripe_subscription_id: a.stripe_subscription_id,
    client_name,
    client_email,
    produit_nom: frName,
    type_facturation: pt?.type_facturation || "—",
    prix: pt?.prix || 0,
    id_commande: a.id_commande,
    commande,
  };
}

export async function cancelSubscription(id: number): Promise<void> {
  await requireActiveAal2Admin();
  const supabase = await createAdminClient();

  const { data: abo } = await supabase
    .from("abonnement")
    .select("stripe_subscription_id")
    .eq("id_abonnement", id)
    .single();

  if (abo?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(abo.stripe_subscription_id);
    } catch {
      // Stripe failure is non-blocking for backoffice
    }
  }

  await supabase
    .from("abonnement")
    .update({ statut_abonnement: "annulé" })
    .eq("id_abonnement", id);
}

export async function reactivateSubscription(id: number): Promise<void> {
  await requireActiveAal2Admin();
  const supabase = await createAdminClient();

  const { data: abo } = await supabase
    .from("abonnement")
    .select("stripe_subscription_id")
    .eq("id_abonnement", id)
    .single();

  if (abo?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.resume(abo.stripe_subscription_id, {
        billing_cycle_anchor: "now",
      });
    } catch {
      // If Stripe resume fails (e.g. sub fully canceled), just update DB status
    }
  }

  await supabase
    .from("abonnement")
    .update({ statut_abonnement: "actif" })
    .eq("id_abonnement", id);
}

export async function bulkCancelSubscriptions(ids: number[]): Promise<void> {
  for (const id of ids) {
    await cancelSubscription(id);
  }
}
