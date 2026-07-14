"use server";

import { requireActiveAal2Admin } from "@/lib/auth/admin-guard";
import { pickTranslation, type Locale } from "@/lib/i18n/translations";
import { stripe } from "@/lib/stripe";
import { syncStripeSubscription } from "@/lib/stripe/subscription-sync";
import { normalizeSubscriptionStatus } from "@/lib/subscriptions/status";
import { createAdminClient } from "@/lib/supabase/server";

export type SubscriptionRow = {
  annulation_programmee: boolean;
  client_email: string;
  client_name: string | null;
  date_debut: string;
  date_fin: string | null;
  id_abonnement: number;
  id_commande: number;
  nombre_utilisateurs: number;
  prix: number;
  produit_nom: string;
  statut_abonnement: string;
  stripe_subscription_id: string | null;
  type_facturation: string;
};

export type SubscriptionDetail = SubscriptionRow & {
  commande: {
    date_commande: string;
    id_commande: number;
    montant_total: number;
    statut_commande: string;
  } | null;
};

type SubscriptionQueryRow = {
  annulation_programmee: boolean;
  commande: { mail_utilisateur_invite: string | null } | null;
  date_debut: string;
  date_fin: string | null;
  id_abonnement: number;
  id_commande: number;
  id_compte: string | null;
  nombre_utilisateurs: number;
  prix_tarif: {
    prix: number;
    produit: {
      produit_traduction: { langue: string; nom_pro: string }[] | null;
    } | null;
    type_facturation: string;
  } | null;
  statut_abonnement: string;
  stripe_subscription_id: string | null;
};

const SUBSCRIPTION_SELECT = `
  id_abonnement,
  date_debut,
  date_fin,
  statut_abonnement,
  stripe_subscription_id,
  id_commande,
  id_compte,
  id_prix,
  annulation_programmee,
  nombre_utilisateurs,
  commande (mail_utilisateur_invite),
  prix_tarif (
    prix,
    type_facturation,
    produit (produit_traduction (nom_pro, langue))
  )
`;

function productName(row: SubscriptionQueryRow, locale: Locale) {
  return (
    pickTranslation(row.prix_tarif?.produit?.produit_traduction, locale)
      ?.nom_pro ?? "—"
  );
}

export async function getSubscriptions(
  locale: Locale,
): Promise<SubscriptionRow[]> {
  await requireActiveAal2Admin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("abonnement")
    .select(SUBSCRIPTION_SELECT)
    .order("date_debut", { ascending: false });
  if (error || !data) return [];

  const rows = data as unknown as SubscriptionQueryRow[];
  const accountIds = [
    ...new Set(rows.flatMap((row) => (row.id_compte ? [row.id_compte] : []))),
  ];
  const userMap = new Map<
    string,
    { adresse_mail: string; nom_complet: string }
  >();
  if (accountIds.length > 0) {
    const { data: users } = await supabase
      .from("utilisateur")
      .select("id_compte, nom_complet, adresse_mail")
      .in("id_compte", accountIds);
    for (const user of users ?? []) userMap.set(user.id_compte, user);
  }

  return rows.map((row) => {
    const user = row.id_compte ? userMap.get(row.id_compte) : null;
    return {
      annulation_programmee: row.annulation_programmee,
      client_email:
        user?.adresse_mail ?? row.commande?.mail_utilisateur_invite ?? "—",
      client_name: user?.nom_complet ?? null,
      date_debut: row.date_debut,
      date_fin: row.date_fin,
      id_abonnement: row.id_abonnement,
      id_commande: row.id_commande,
      nombre_utilisateurs: Math.max(1, row.nombre_utilisateurs || 1),
      prix: row.prix_tarif?.prix ?? 0,
      produit_nom: productName(row, locale),
      statut_abonnement: normalizeSubscriptionStatus(row.statut_abonnement),
      stripe_subscription_id: row.stripe_subscription_id,
      type_facturation: row.prix_tarif?.type_facturation ?? "—",
    };
  });
}

export async function getSubscriptionDetail(
  id: number,
  locale: Locale,
): Promise<SubscriptionDetail | null> {
  await requireActiveAal2Admin();
  if (!Number.isInteger(id) || id <= 0) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("abonnement")
    .select(SUBSCRIPTION_SELECT)
    .eq("id_abonnement", id)
    .maybeSingle();
  if (error || !data) return null;

  const row = data as unknown as SubscriptionQueryRow;
  let clientEmail = row.commande?.mail_utilisateur_invite ?? "—";
  let clientName: string | null = null;
  if (row.id_compte) {
    const { data: user } = await supabase
      .from("utilisateur")
      .select("nom_complet, adresse_mail")
      .eq("id_compte", row.id_compte)
      .maybeSingle();
    if (user) {
      clientEmail = user.adresse_mail;
      clientName = user.nom_complet;
    }
  }

  const { data: order } = await supabase
    .from("commande")
    .select("id_commande, date_commande, montant_total, statut_commande")
    .eq("id_commande", row.id_commande)
    .maybeSingle();

  return {
    annulation_programmee: row.annulation_programmee,
    client_email: clientEmail,
    client_name: clientName,
    commande: order ?? null,
    date_debut: row.date_debut,
    date_fin: row.date_fin,
    id_abonnement: row.id_abonnement,
    id_commande: row.id_commande,
    nombre_utilisateurs: Math.max(1, row.nombre_utilisateurs || 1),
    prix: row.prix_tarif?.prix ?? 0,
    produit_nom: productName(row, locale),
    statut_abonnement: normalizeSubscriptionStatus(row.statut_abonnement),
    stripe_subscription_id: row.stripe_subscription_id,
    type_facturation: row.prix_tarif?.type_facturation ?? "—",
  };
}

export async function cancelSubscription(id: number) {
  await requireActiveAal2Admin();
  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("abonnement")
    .select("stripe_subscription_id")
    .eq("id_abonnement", id)
    .maybeSingle();
  if (!row?.stripe_subscription_id) {
    return { error: "missing_stripe_subscription", ok: false as const };
  }

  try {
    const subscription = await stripe.subscriptions.cancel(
      row.stripe_subscription_id,
    );
    await syncStripeSubscription(subscription);
    return { ok: true as const };
  } catch (error) {
    console.error("[subscriptions] Stripe cancellation failed", error);
    return { error: "stripe_cancel_failed", ok: false as const };
  }
}

export async function reactivateSubscription(id: number) {
  await requireActiveAal2Admin();
  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("abonnement")
    .select("stripe_subscription_id, statut_abonnement")
    .eq("id_abonnement", id)
    .maybeSingle();
  if (
    !row?.stripe_subscription_id ||
    normalizeSubscriptionStatus(row.statut_abonnement) !== "paused"
  ) {
    return { error: "subscription_not_resumable", ok: false as const };
  }

  try {
    const subscription = await stripe.subscriptions.resume(
      row.stripe_subscription_id,
      { billing_cycle_anchor: "now" },
    );
    await syncStripeSubscription(subscription);
    return { ok: true as const };
  } catch (error) {
    console.error("[subscriptions] Stripe resume failed", error);
    return { error: "stripe_resume_failed", ok: false as const };
  }
}

export async function bulkCancelSubscriptions(ids: number[]) {
  const failures: number[] = [];
  for (const id of [...new Set(ids)].filter((value) => Number.isInteger(value))) {
    const result = await cancelSubscription(id);
    if (!result.ok) failures.push(id);
  }
  return { failures, ok: failures.length === 0 };
}
