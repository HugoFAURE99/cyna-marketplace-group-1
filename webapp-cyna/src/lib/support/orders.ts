import "server-only";

import type { ChatOrderOption } from "@/lib/gemini/types";
import type { Locale } from "@/lib/i18n/translations";
import { createAdminClient } from "@/lib/supabase/server";

const MAX_ORDERS = 20;

export async function getUserOrderOptions(userId: string, locale: Locale): Promise<ChatOrderOption[]> {
  const { data, error } = await createAdminClient()
    .from("commande")
    .select("id_commande, date_commande")
    .eq("id_compte", userId)
    .order("date_commande", { ascending: false })
    .limit(MAX_ORDERS);
  if (error || !data) return [];
  const format = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" });
  return data.map((order) => ({
    id: order.id_commande,
    label: `#${order.id_commande} · ${format.format(new Date(order.date_commande))}`,
  }));
}
