"use server";

import { createAdminClient } from "@/lib/supabase/server";

type Period = "7days" | "5weeks";

type SalesData = {
  salesByDay: { label: string; total: number }[];
  salesByCategory: { label: string; categories: Record<string, number> }[];
  categoryPieData: { name: string; value: number }[];
  categoryNames: string[];
};

const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

// Local calendar-day key (YYYY-MM-DD). Using local time — not toISOString(),
// which is UTC — keeps buckets aligned with the day labels and the user's
// timezone, otherwise orders land one day off near midnight.
function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDayLabel(date: Date): string {
  const day = DAYS_FR[date.getDay()];
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${day} ${dd}/${mm}`;
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function formatWeekLabel(date: Date): string {
  return `Sem. ${getISOWeek(date)}`;
}

export async function getSalesData(period: Period): Promise<SalesData> {
  const supabase = await createAdminClient();

  const now = new Date();
  let startDate: Date;

  if (period === "7days") {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
  } else {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 34);
    startDate.setHours(0, 0, 0, 0);
  }

  const { data: orders, error } = await supabase
    .from("commande")
    .select(
      `
      id_commande,
      date_commande,
      montant_total,
      statut_commande,
      ligne_commande (
        prix_unitaire,
        quantite,
        sous_total,
        prix_tarif (
          id_produit,
          produit (
            id_categorie,
            categorie (
              categorie_traduction (
                cat_nom,
                langue
              )
            )
          )
        )
      )
    `
    )
    // A completed sale is written as "Validée" by the checkout webhook.
    // Legacy/seed values ("payee"/"active") are kept for backward compatibility.
    .in("statut_commande", ["Validée", "payee", "active"])
    .gte("date_commande", startDate.toISOString())
    .lte("date_commande", now.toISOString());

  if (error || !orders || orders.length === 0) {
    return {
      salesByDay: [],
      salesByCategory: [],
      categoryPieData: [],
      categoryNames: [],
    };
  }

  // Build time buckets
  const buckets: { key: string; label: string }[] = [];

  if (period === "7days") {
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      buckets.push({ key: localDateKey(d), label: formatDayLabel(d) });
    }
  } else {
    for (let i = 0; i < 5; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i * 7);
      const weekNum = getISOWeek(d);
      buckets.push({ key: `W${weekNum}`, label: formatWeekLabel(d) });
    }
  }

  const salesByBucket: Record<string, number> = {};
  const salesByCatBucket: Record<string, Record<string, number>> = {};
  const categoryTotals: Record<string, number> = {};
  const categoryNamesSet = new Set<string>();

  for (const b of buckets) {
    salesByBucket[b.key] = 0;
    salesByCatBucket[b.key] = {};
  }

  for (const order of orders) {
    const orderDate = new Date(order.date_commande);
    let bucketKey: string;

    if (period === "7days") {
      bucketKey = localDateKey(orderDate);
    } else {
      bucketKey = `W${getISOWeek(orderDate)}`;
    }

    if (!(bucketKey in salesByBucket)) continue;

    salesByBucket[bucketKey] = (salesByBucket[bucketKey] || 0) + (order.montant_total || 0);

    const lignes = order.ligne_commande as any[];
    if (!lignes) continue;

    for (const ligne of lignes) {
      const prixTarif = ligne.prix_tarif as any;
      if (!prixTarif) continue;
      const produit = prixTarif.produit as any;
      if (!produit) continue;
      const categorie = produit.categorie as any;
      if (!categorie) continue;
      const traductions = categorie.categorie_traduction as any[];
      if (!traductions) continue;

      const frTrad = traductions.find((t: any) => t.langue === "fr");
      const catName = frTrad?.cat_nom || "Autre";
      categoryNamesSet.add(catName);

      const amount = ligne.sous_total || 0;

      if (!salesByCatBucket[bucketKey]) salesByCatBucket[bucketKey] = {};
      salesByCatBucket[bucketKey][catName] =
        (salesByCatBucket[bucketKey][catName] || 0) + amount;

      categoryTotals[catName] = (categoryTotals[catName] || 0) + amount;
    }
  }

  const categoryNames = Array.from(categoryNamesSet).sort();

  const salesByDay = buckets.map((b) => ({
    label: b.label,
    total: Math.round((salesByBucket[b.key] || 0) * 100) / 100,
  }));

  const salesByCategory = buckets.map((b) => ({
    label: b.label,
    categories: salesByCatBucket[b.key] || {},
  }));

  const categoryPieData = categoryNames.map((name) => ({
    name,
    value: Math.round((categoryTotals[name] || 0) * 100) / 100,
  }));

  return { salesByDay, salesByCategory, categoryPieData, categoryNames };
}
