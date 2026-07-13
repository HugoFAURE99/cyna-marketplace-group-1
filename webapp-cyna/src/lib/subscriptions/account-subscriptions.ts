import "server-only";

import type { AccountSubscription } from "@/components/account/subscription-card";
import { createServerClient } from "@/lib/supabase/server-client";

export async function getAccountSubscriptions(orderId?: number) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("abonnement")
    .select(`
      id_abonnement,
      id_commande,
      statut_abonnement,
      date_debut,
      date_fin,
      nombre_utilisateurs,
      annulation_programmee,
      stripe_subscription_id,
      stripe_subscription_item_id,
      commande (date_commande, montant_total, statut_commande),
      prix_tarif (
        prix,
        type_facturation,
        prix_tarif_traduction (nom_prix_tarif, langue),
        produit (produit_traduction (nom_pro, langue))
      )
    `)
    .eq("id_compte", user.id)
    .order("date_debut", { ascending: false });
  if (orderId !== undefined) query = query.eq("id_commande", orderId);

  const { data, error } = await query;
  if (error) {
    throw new Error(`SUBSCRIPTION_LIST_QUERY_FAILED: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const {
      stripe_subscription_id: stripeSubscriptionId,
      stripe_subscription_item_id: stripeItemId,
      ...safeRow
    } = row;
    return {
      ...safeRow,
      is_manageable: Boolean(stripeSubscriptionId && stripeItemId),
    } as unknown as AccountSubscription;
  });
}
