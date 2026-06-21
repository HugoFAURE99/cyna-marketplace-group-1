"use server";

import { createAdminClient } from "@/lib/supabase/server";

export type OrderRow = {
  id_commande: number;
  date_commande: string;
  montant_total: number;
  statut_commande: string;
  client_email: string;
  client_name: string | null;
};

export type OrderDetail = OrderRow & {
  lignes: {
    produit_nom: string;
    quantite: number;
    prix_unitaire: number;
    sous_total: number;
    type_facturation: string;
  }[];
  promotion: {
    id_promotion: number;
    type_remise: string;
    valeur_remise: number;
  } | null;
};

export async function getOrders(): Promise<OrderRow[]> {
  const supabase = await createAdminClient();

  const { data: commandes, error } = await supabase
    .from("commande")
    .select("id_commande, date_commande, montant_total, statut_commande, mail_utilisateur_invite, id_promotion")
    .order("date_commande", { ascending: false });

  if (error || !commandes) return [];

  const orderIds = commandes.map((c) => c.id_commande);

  // Find linked users via abonnement
  const { data: abonnements } = await supabase
    .from("abonnement")
    .select("id_commande, id_compte")
    .in("id_commande", orderIds);

  const commandeToCompte = new Map<number, string>();
  for (const a of abonnements ?? []) {
    if (a.id_compte && !commandeToCompte.has(a.id_commande)) {
      commandeToCompte.set(a.id_commande, a.id_compte);
    }
  }

  // Fetch user names for linked accounts
  const compteIds = [...new Set(commandeToCompte.values())];
  const userMap = new Map<string, { nom_complet: string; adresse_mail: string }>();

  if (compteIds.length > 0) {
    const { data: users } = await supabase
      .from("utilisateur")
      .select("id_compte, nom_complet, adresse_mail")
      .in("id_compte", compteIds);

    for (const u of users ?? []) {
      userMap.set(u.id_compte, { nom_complet: u.nom_complet, adresse_mail: u.adresse_mail });
    }
  }

  return commandes.map((c) => {
    const compteId = commandeToCompte.get(c.id_commande);
    const user = compteId ? userMap.get(compteId) : null;

    return {
      id_commande: c.id_commande,
      date_commande: c.date_commande,
      montant_total: c.montant_total,
      statut_commande: c.statut_commande,
      client_email: user?.adresse_mail || c.mail_utilisateur_invite || "—",
      client_name: user?.nom_complet || null,
    };
  });
}

export async function getOrderDetail(id: number): Promise<OrderDetail | null> {
  const supabase = await createAdminClient();

  const { data: commande, error } = await supabase
    .from("commande")
    .select("id_commande, date_commande, montant_total, statut_commande, mail_utilisateur_invite, id_promotion")
    .eq("id_commande", id)
    .single();

  if (error || !commande) return null;

  // Client info
  const { data: abonnement } = await supabase
    .from("abonnement")
    .select("id_compte")
    .eq("id_commande", id)
    .limit(1)
    .maybeSingle();

  let client_email = commande.mail_utilisateur_invite || "—";
  let client_name: string | null = null;

  if (abonnement?.id_compte) {
    const { data: user } = await supabase
      .from("utilisateur")
      .select("nom_complet, adresse_mail")
      .eq("id_compte", abonnement.id_compte)
      .single();

    if (user) {
      client_email = user.adresse_mail;
      client_name = user.nom_complet;
    }
  }

  // Line items
  const { data: lignes } = await supabase
    .from("ligne_commande")
    .select(`
      quantite,
      prix_unitaire,
      sous_total,
      prix_tarif (
        type_facturation,
        produit (
          produit_traduction (
            nom_pro,
            langue
          )
        )
      )
    `)
    .eq("id_commande", id);

  const lignesFormatted = (lignes ?? []).map((l: any) => {
    const pt = l.prix_tarif;
    const traductions = pt?.produit?.produit_traduction as any[] | undefined;
    const frName = traductions?.find((t: any) => t.langue === "fr")?.nom_pro || "—";
    return {
      produit_nom: frName,
      quantite: l.quantite,
      prix_unitaire: l.prix_unitaire,
      sous_total: l.sous_total,
      type_facturation: pt?.type_facturation || "—",
    };
  });

  // Promotion
  let promotion: OrderDetail["promotion"] = null;
  if (commande.id_promotion) {
    const { data: promo } = await supabase
      .from("promotion")
      .select("id_promotion, type_remise, valeur_remise")
      .eq("id_promotion", commande.id_promotion)
      .single();

    if (promo) promotion = promo;
  }

  return {
    id_commande: commande.id_commande,
    date_commande: commande.date_commande,
    montant_total: commande.montant_total,
    statut_commande: commande.statut_commande,
    client_email,
    client_name,
    lignes: lignesFormatted,
    promotion,
  };
}
