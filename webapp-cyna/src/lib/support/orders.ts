import "server-only";

import { getTranslations } from "next-intl/server";

import type { ChatOrderOption } from "@/lib/gemini/types";
import type { Locale } from "@/lib/i18n/translations";
import { createServerClient } from "@/lib/supabase/server-client";

const MAX_ORDERS = 20;

type OrderOptionRow = {
  date_commande: string;
  id_commande: number;
  ligne_commande: {
    prix_tarif: {
      produit: { produit_traduction: { langue: string; nom_pro: string }[] } | null;
    } | null;
  }[];
};

export async function getUserOrderOptions(userId: string, locale: Locale): Promise<ChatOrderOption[]> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return [];
  const { data, error } = await supabase.from("commande").select(`
    id_commande, date_commande,
    ligne_commande (prix_tarif (produit (produit_traduction (langue, nom_pro))))
  `).eq("id_compte", user.id).order("date_commande", { ascending: false }).limit(MAX_ORDERS);
  if (error || !data) return [];

  const t = await getTranslations({ locale, namespace: "support" });
  const format = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" });
  return (data as unknown as OrderOptionRow[]).map((order) => {
    const names = order.ligne_commande.map((line) => {
      const translations = line.prix_tarif?.produit?.produit_traduction ?? [];
      return translations.find((item) => item.langue === locale)?.nom_pro
        ?? translations.find((item) => item.langue === "fr")?.nom_pro
        ?? translations[0]?.nom_pro;
    }).filter((name): name is string => !!name);
    const contents = names.length === 0
      ? t("orderContentsUnavailable")
      : names.length === 1
        ? names[0]
        : `${names[0]} ${t("otherProducts", { count: names.length - 1 })}`;
    return { id: order.id_commande, label: `#${order.id_commande} · ${contents} · ${format.format(new Date(order.date_commande))}` };
  });
}
