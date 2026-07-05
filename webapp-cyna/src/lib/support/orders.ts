// Fetches a signed-in user's recent orders for the in-chat ticket form's
// "related order" selector. Orders link to accounts through the abonnement
// table (commande has no id_compte). Server-only; uses the admin client.
import "server-only";

import type { ChatOrderOption } from "@/lib/gemini/types";
import type { Locale } from "@/lib/i18n/translations";
import { createAdminClient } from "@/lib/supabase/server";

const MAX_ORDERS = 8;

export async function getUserOrderOptions(
  userId: string,
  locale: Locale,
): Promise<ChatOrderOption[]> {
  const supabase = createAdminClient();

  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from("abonnement")
    .select("id_commande")
    .eq("id_compte", userId);
  if (subscriptionsError || !subscriptions || subscriptions.length === 0) {
    return [];
  }

  const orderIds = [...new Set(subscriptions.map((row) => row.id_commande))];
  const { data: orders, error: ordersError } = await supabase
    .from("commande")
    .select("id_commande, date_commande")
    .in("id_commande", orderIds)
    .order("date_commande", { ascending: false })
    .limit(MAX_ORDERS);
  if (ordersError || !orders) {
    return [];
  }

  const dateFormat = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return orders.map((order) => ({
    id: order.id_commande,
    label: `#${order.id_commande} · ${dateFormat.format(new Date(order.date_commande))}`,
  }));
}
