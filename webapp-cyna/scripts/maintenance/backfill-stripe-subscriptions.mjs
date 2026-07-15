import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const apply = process.argv.includes("--apply");
const required = [
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];
for (const name of required) {
  if (!process.env[name]) throw new Error(`Missing ${name}`);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-06-24.dahlia",
});
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const { data: rows, error: rowsError } = await supabase
  .from("abonnement")
  .select("*")
  .not("stripe_subscription_id", "is", null)
  .order("id_abonnement");
if (rowsError) throw rowsError;

const { data: tariffs, error: tariffsError } = await supabase
  .from("prix_tarif")
  .select("id_prix, stripe_price_id");
if (tariffsError) throw tariffsError;
const tariffByPrice = new Map(
  (tariffs ?? []).map((tariff) => [tariff.stripe_price_id, tariff.id_prix]),
);

const groups = new Map();
for (const row of rows ?? []) {
  const grouped = groups.get(row.stripe_subscription_id) ?? [];
  grouped.push(row);
  groups.set(row.stripe_subscription_id, grouped);
}

const report = {
  mode: apply ? "apply" : "dry-run",
  subscriptions: groups.size,
  updates: 0,
  inserts: 0,
  unchanged: 0,
  unmappedPrices: [],
  ambiguousRows: [],
  missingContext: [],
  stripeErrors: [],
};

for (const [subscriptionId, dbRows] of groups) {
  let subscription;
  try {
    subscription = await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    report.stripeErrors.push({ subscriptionId, message: error.message });
    continue;
  }

  let scheduledPrices = new Set();
  if (subscription.cancel_at_period_end) {
    scheduledPrices = new Set(
      subscription.items.data.map((item) => item.price.id),
    );
  } else if (subscription.schedule) {
    const scheduleId =
      typeof subscription.schedule === "string"
        ? subscription.schedule
        : subscription.schedule.id;
    const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
    if (schedule.metadata?.cyna_managed === "true") {
      const currentEnd = Math.max(
        ...subscription.items.data.map((item) => item.current_period_end ?? 0),
      );
      const nextPhase = schedule.phases.find(
        (phase) => phase.start_date >= currentEnd,
      );
      if (nextPhase) {
        const futurePrices = new Set(
          nextPhase.items.map((item) =>
            typeof item.price === "string" ? item.price : item.price.id,
          ),
        );
        scheduledPrices = new Set(
          subscription.items.data
            .map((item) => item.price.id)
            .filter((priceId) => !futurePrices.has(priceId)),
        );
      }
    }
  }

  for (const item of subscription.items.data) {
    const tariffId = tariffByPrice.get(item.price.id);
    if (!tariffId) {
      report.unmappedPrices.push({
        subscriptionId,
        itemId: item.id,
        priceId: item.price.id,
      });
      continue;
    }

    const byItem = dbRows.find(
      (row) => row.stripe_subscription_item_id === item.id,
    );
    const legacy = dbRows.filter(
      (row) =>
        row.stripe_subscription_item_id === null && row.id_prix === tariffId,
    );
    if (!byItem && legacy.length > 1) {
      report.ambiguousRows.push({
        subscriptionId,
        itemId: item.id,
        rowIds: legacy.map((row) => row.id_abonnement),
      });
      continue;
    }

    const existing = byItem ?? legacy[0];
    const payload = {
      annulation_programmee: scheduledPrices.has(item.price.id),
      date_debut: new Date(
        (item.current_period_start ?? subscription.created) * 1000,
      ).toISOString(),
      date_fin: item.current_period_end
        ? new Date(item.current_period_end * 1000).toISOString()
        : null,
      id_prix: tariffId,
      nombre_utilisateurs: item.quantity ?? 1,
      statut_abonnement: subscription.status,
      stripe_subscription_id: subscription.id,
      stripe_subscription_item_id: item.id,
    };

    if (existing) {
      const changed = Object.entries(payload).some(
        ([key, value]) => existing[key] !== value,
      );
      if (!changed) {
        report.unchanged += 1;
        continue;
      }
      report.updates += 1;
      if (apply) {
        const { error } = await supabase
          .from("abonnement")
          .update(payload)
          .eq("id_abonnement", existing.id_abonnement);
        if (error) throw error;
      }
      continue;
    }

    const context = dbRows[0];
    if (!context?.id_commande) {
      report.missingContext.push({ subscriptionId, itemId: item.id });
      continue;
    }
    report.inserts += 1;
    if (apply) {
      const { error } = await supabase.from("abonnement").insert({
        ...payload,
        id_commande: context.id_commande,
        id_compte: context.id_compte,
      });
      if (error) throw error;
    }
  }
}

console.log(JSON.stringify(report, null, 2));
if (!apply) {
  console.log("Dry run only. Re-run with --apply after reviewing this report.");
}
