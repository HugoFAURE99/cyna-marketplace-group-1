import "server-only";

import { aggregateCommerceReport, type CommerceOrder } from "@/lib/admin/commerce-report-core";
import type { CommerceReportData, ReportRange, SubscriptionHorizon } from "@/lib/admin/commerce-report-types";
import { aggregateSubscriptionHealth, type SubscriptionHealthSource } from "@/lib/admin/subscription-health";
import { pickTranslation, type Locale } from "@/lib/i18n/translations";
import { createAdminClient } from "@/lib/supabase/server";

type Translation = { langue: string; nom_pro: string };
type CategoryTranslation = { cat_nom: string; langue: string };
type OrderQueryLine = {
  quantite: number;
  sous_total: number;
  prix_tarif: {
    id_produit: number;
    type_facturation: string;
    produit: {
      id_categorie: number;
      produit_traduction: Translation[] | null;
      categorie: { categorie_traduction: CategoryTranslation[] | null } | null;
    } | null;
  } | null;
};
type OrderQueryRow = {
  date_commande: string;
  id_commande: number;
  id_compte: string | null;
  ligne_commande: OrderQueryLine[] | null;
  mail_utilisateur_invite: string | null;
  montant_total: number;
  statut_commande: string;
};
type SubscriptionQueryRow = {
  annulation_programmee: boolean;
  commande: { mail_utilisateur_invite: string | null } | null;
  date_fin: string | null;
  id_abonnement: number;
  id_commande: number;
  id_compte: string | null;
  nombre_utilisateurs: number;
  prix_tarif: {
    id_produit: number;
    prix: number;
    produit: { produit_traduction: Translation[] | null } | null;
    type_facturation: string;
  } | null;
  statut_abonnement: string;
};

function fallbackLabel(locale: Locale, kind: "category" | "product" | "plan"): string {
  const labels = {
    en: { category: "Other", product: "Unknown product", plan: "Other" },
    fr: { category: "Autre", product: "Produit inconnu", plan: "Autre" },
  } as const;
  return labels[locale][kind];
}

function mapOrder(row: OrderQueryRow, locale: Locale): CommerceOrder {
  return {
    id: row.id_commande,
    date: row.date_commande,
    total: Number(row.montant_total) || 0,
    status: row.statut_commande,
    customerId: row.id_compte,
    guestEmail: row.mail_utilisateur_invite,
    lines: (row.ligne_commande ?? []).flatMap((line) => {
      const price = line.prix_tarif;
      const product = price?.produit;
      if (!price || !product) return [];
      const productName = pickTranslation(product.produit_traduction, locale)?.nom_pro;
      const categoryName = pickTranslation(
        product.categorie?.categorie_traduction,
        locale,
      )?.cat_nom;
      return [{
        billingPlan: price.type_facturation || fallbackLabel(locale, "plan"),
        categoryId: product.id_categorie,
        categoryName: categoryName || fallbackLabel(locale, "category"),
        productId: price.id_produit,
        productName: productName || fallbackLabel(locale, "product"),
        quantity: Number(line.quantite) || 0,
        subtotal: Number(line.sous_total) || 0,
      }];
    }),
  };
}

export async function getCommerceReport(
  range: ReportRange,
  locale: Locale,
  horizon: SubscriptionHorizon = 30,
): Promise<CommerceReportData> {
  const supabase = createAdminClient();
  const [ordersResult, subscriptionsResult] = await Promise.all([
    supabase
      .from("commande")
      .select(`
        id_commande,
        date_commande,
        montant_total,
        statut_commande,
        id_compte,
        mail_utilisateur_invite,
        ligne_commande (
          quantite,
          sous_total,
          prix_tarif (
            id_produit,
            type_facturation,
            produit (
              id_categorie,
              produit_traduction (langue, nom_pro),
              categorie (categorie_traduction (langue, cat_nom))
            )
          )
        )
      `)
      .gte("date_commande", range.previousFromIso)
      .lt("date_commande", range.toExclusiveIso),
    supabase
      .from("abonnement")
      .select(`
        id_abonnement,
        id_commande,
        id_compte,
        date_fin,
        statut_abonnement,
        annulation_programmee,
        nombre_utilisateurs,
        commande (mail_utilisateur_invite),
        prix_tarif (
          id_produit,
          prix,
          type_facturation,
          produit (produit_traduction (langue, nom_pro))
        )
      `),
  ]);

  if (ordersResult.error) {
    throw new Error(`REPORT_ORDERS: ${ordersResult.error.message}`);
  }
  if (subscriptionsResult.error) {
    throw new Error(`REPORT_SUBSCRIPTIONS: ${subscriptionsResult.error.message}`);
  }

  const subscriptions = (subscriptionsResult.data ?? []) as unknown as SubscriptionQueryRow[];
  const accountIds = [...new Set(subscriptions.map((item) => item.id_compte).filter((id): id is string => Boolean(id)))];
  const { data: users, error: usersError } = accountIds.length
    ? await supabase.from("utilisateur").select("id_compte, nom_complet, adresse_mail").in("id_compte", accountIds)
    : { data: [], error: null };
  if (usersError) throw new Error(`REPORT_SUBSCRIPTION_USERS: ${usersError.message}`);
  const usersById = new Map((users ?? []).map((user) => [user.id_compte, user]));
  const subscriptionSources: SubscriptionHealthSource[] = subscriptions.map((item) => {
    const user = item.id_compte ? usersById.get(item.id_compte) : null;
    const productName = pickTranslation(item.prix_tarif?.produit?.produit_traduction, locale)?.nom_pro;
    return {
      billingPlan: item.prix_tarif?.type_facturation || fallbackLabel(locale, "plan"),
      contactEmail: user?.adresse_mail ?? item.commande?.mail_utilisateur_invite ?? null,
      customerName: user?.nom_complet ?? null,
      endDate: item.date_fin,
      id: item.id_abonnement,
      orderId: item.id_commande,
      priceCents: Number(item.prix_tarif?.prix) || 0,
      productId: item.prix_tarif?.id_produit ?? null,
      productName: productName || fallbackLabel(locale, "product"),
      scheduledCancellation: item.annulation_programmee,
      seats: Number(item.nombre_utilisateurs) || 1,
      status: item.statut_abonnement,
    };
  });
  return aggregateCommerceReport({
    locale,
    range,
    orders: ((ordersResult.data ?? []) as unknown as OrderQueryRow[]).map((row) =>
      mapOrder(row, locale),
    ),
    subscriptionHealth: aggregateSubscriptionHealth({ horizon, subscriptions: subscriptionSources }),
  });
}
