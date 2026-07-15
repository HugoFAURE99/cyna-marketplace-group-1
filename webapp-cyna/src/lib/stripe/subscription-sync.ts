import "server-only";

import type Stripe from "stripe";

import { createAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import type { TablesInsert, TablesUpdate } from "@/types/database.types";

type SyncContext = {
  accountId?: string | null;
  orderId?: number | null;
};

export async function syncStripeSubscription(
  subscription: Stripe.Subscription,
  context: SyncContext = {},
) {
  const supabase = createAdminClient();
  const items = subscription.items.data;
  const priceIds = [...new Set(items.map((item) => stripeId(item.price)))];
  const { data: tariffs, error: tariffError } = await supabase
    .from("prix_tarif")
    .select("id_prix, stripe_price_id")
    .in("stripe_price_id", priceIds);
  if (tariffError) throw tariffError;

  const tariffByStripePrice = new Map(
    (tariffs ?? []).map((tariff) => [tariff.stripe_price_id, tariff.id_prix]),
  );
  const missingPrices = priceIds.filter((priceId) => !tariffByStripePrice.has(priceId));
  if (missingPrices.length > 0) {
    throw new Error(
      `Stripe subscription ${subscription.id} contains unmapped prices: ${missingPrices.join(", ")}`,
    );
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("abonnement")
    .select("*")
    .eq("stripe_subscription_id", subscription.id);
  if (existingError) throw existingError;

  const metadataOrderId = positiveInteger(subscription.metadata.id_commande);
  const orderId = context.orderId ?? existingRows?.[0]?.id_commande ?? metadataOrderId;
  const metadataAccountId = normaliseAccountId(subscription.metadata.id_compte);
  const accountId = context.accountId ?? existingRows?.[0]?.id_compte ?? metadataAccountId;
  if (!orderId) {
    throw new Error(`Cannot resolve the CYNA order for Stripe subscription ${subscription.id}`);
  }

  const scheduledPriceIds = await getScheduledPriceIds(subscription);
  const currentItemIds = new Set(items.map((item) => item.id));
  const claimedLegacyRows = new Set<number>();

  for (const item of items) {
    const priceId = stripeId(item.price);
    const tariffId = tariffByStripePrice.get(priceId);
    if (!tariffId) continue;

    const payload: TablesUpdate<"abonnement"> = {
      annulation_programmee:
        subscription.status !== "canceled" && scheduledPriceIds.has(priceId),
      date_debut: toIso(item.current_period_start ?? subscription.created),
      date_fin: item.current_period_end ? toIso(item.current_period_end) : null,
      id_commande: orderId,
      id_compte: accountId ?? null,
      id_prix: tariffId,
      nombre_utilisateurs: item.quantity ?? 1,
      statut_abonnement: subscription.status,
      stripe_subscription_id: subscription.id,
      stripe_subscription_item_id: item.id,
    };

    const byItem = existingRows?.find(
      (row) => row.stripe_subscription_item_id === item.id,
    );
    const legacyMatches = (existingRows ?? []).filter(
      (row) =>
        row.stripe_subscription_item_id === null &&
        row.id_prix === tariffId &&
        !claimedLegacyRows.has(row.id_abonnement),
    );
    const existing = byItem ?? (legacyMatches.length === 1 ? legacyMatches[0] : null);

    if (existing) {
      if (existing.stripe_subscription_item_id === null) {
        claimedLegacyRows.add(existing.id_abonnement);
      }
      const { error } = await supabase
        .from("abonnement")
        .update(payload)
        .eq("id_abonnement", existing.id_abonnement);
      if (error) throw error;
    } else {
      const insert: TablesInsert<"abonnement"> = {
        ...(payload as TablesInsert<"abonnement">),
        date_debut: payload.date_debut as string,
        id_commande: orderId,
        id_prix: tariffId,
        statut_abonnement: subscription.status,
      };
      const { error } = await supabase.from("abonnement").insert(insert);
      if (error) throw error;
    }
  }

  const removedIds = (existingRows ?? [])
    .filter(
      (row) =>
        row.stripe_subscription_item_id &&
        !currentItemIds.has(row.stripe_subscription_item_id),
    )
    .map((row) => row.id_abonnement);
  if (removedIds.length > 0) {
    const endedAt = subscription.ended_at
      ? toIso(subscription.ended_at)
      : new Date().toISOString();
    const { error } = await supabase
      .from("abonnement")
      .update({
        annulation_programmee: false,
        date_fin: endedAt,
        statut_abonnement: "canceled",
      })
      .in("id_abonnement", removedIds);
    if (error) throw error;
  }
}

async function getScheduledPriceIds(subscription: Stripe.Subscription) {
  const currentPrices = subscription.items.data.map((item) => stripeId(item.price));
  if (subscription.cancel_at_period_end) return new Set(currentPrices);

  const scheduleId = stripeId(subscription.schedule);
  if (!scheduleId) return new Set<string>();
  const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
  if (schedule.metadata?.cyna_managed !== "true") return new Set<string>();

  const currentEnd = Math.max(
    ...subscription.items.data.map((item) => item.current_period_end ?? 0),
  );
  const nextPhase = schedule.phases.find((phase) => phase.start_date >= currentEnd);
  if (!nextPhase) return new Set<string>();
  const nextPrices = new Set(nextPhase.items.map((item) => stripeId(item.price)));
  return new Set(currentPrices.filter((priceId) => !nextPrices.has(priceId)));
}

function stripeId(value: string | { id: string } | null) {
  return typeof value === "string" ? value : value?.id ?? "";
}

function positiveInteger(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normaliseAccountId(value: string | undefined) {
  return value && value !== "invite" ? value : null;
}

function toIso(timestamp: number) {
  return new Date(timestamp * 1000).toISOString();
}
