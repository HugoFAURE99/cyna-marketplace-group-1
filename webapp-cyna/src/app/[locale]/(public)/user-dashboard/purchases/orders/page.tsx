import { setRequestLocale } from "next-intl/server";

import { OrdersList, type AccountOrder } from "@/components/account/orders-list";
import type { Locale } from "@/lib/i18n/translations";
import { createServerClient } from "@/lib/supabase/server-client";

export const dynamic = "force-dynamic";

export default async function PurchaseOrders({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let orders: AccountOrder[] = [];
  if (user) {
    const { data, error } = await supabase
      .from("commande")
      .select(`
        billing_address_snapshot,
        date_commande,
        id_commande,
        montant_total,
        payment_method_brand,
        payment_method_last4,
        statut_commande,
        facture (*),
        ligne_commande (
          prix_unitaire,
          quantite,
          sous_total,
          prix_tarif (
            type_facturation,
            produit (
              categorie (categorie_traduction (cat_nom, langue)),
              id_categorie,
              produit_traduction (langue, nom_pro)
            )
          )
        )
      `)
      .order("date_commande", { ascending: false });
    if (error) throw new Error(`ORDER_LIST_QUERY_FAILED: ${error.message}`);
    orders = (data ?? []) as unknown as AccountOrder[];
  }
  return <OrdersList locale={locale} orders={orders} />;
}
