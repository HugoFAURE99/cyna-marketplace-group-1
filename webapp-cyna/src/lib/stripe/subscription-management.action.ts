"use server";

import { revalidatePath } from "next/cache";
import type Stripe from "stripe";

import { MAX_LICENSE_USERS, MIN_LICENSE_USERS } from "@/lib/cart/cart-constants";
import { stripe } from "@/lib/stripe";
import { syncStripeSubscription } from "@/lib/stripe/subscription-sync";
import { createServerClient } from "@/lib/supabase/server-client";

export type SubscriptionActionResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "AUTH_REQUIRED"
        | "INVALID_QUANTITY"
        | "NOT_FOUND"
        | "NOT_EDITABLE"
        | "NOT_MAPPED"
        | "CANCELLATION_PENDING"
        | "EXTERNAL_SCHEDULE"
        | "STRIPE_ERROR";
    };

export async function changeSubscriptionUsers(
  subscriptionId: number,
  quantity: number,
): Promise<SubscriptionActionResult> {
  if (
    !Number.isInteger(quantity) ||
    quantity < MIN_LICENSE_USERS ||
    quantity > MAX_LICENSE_USERS
  ) {
    return { ok: false, code: "INVALID_QUANTITY" };
  }

  try {
    const owned = await getOwnedSubscription(subscriptionId);
    if (!owned.ok) return owned.result;
    const { row } = owned;
    if (row.annulation_programmee) {
      return { ok: false, code: "CANCELLATION_PENDING" };
    }
    if (!row.stripe_subscription_id || !row.stripe_subscription_item_id) {
      return { ok: false, code: "NOT_MAPPED" };
    }

    let subscription = await stripe.subscriptions.retrieve(
      row.stripe_subscription_id,
    );
    if (!isEditableStatus(subscription.status)) {
      return { ok: false, code: "NOT_EDITABLE" };
    }
    const item = subscription.items.data.find(
      (candidate) => candidate.id === row.stripe_subscription_item_id,
    );
    if (!item) return { ok: false, code: "NOT_MAPPED" };

    if (subscription.schedule) {
      const canceledItemIds = await getScheduledItemIds(
        row.stripe_subscription_id,
        row.id_compte,
      );
      await configureManagedSchedule(subscription, canceledItemIds, {
        [item.id]: quantity,
      });
      subscription = await stripe.subscriptions.retrieve(subscription.id);
    } else {
      subscription = await stripe.subscriptions.update(subscription.id, {
        items: [{ id: item.id, quantity }],
        proration_behavior: "none",
      });
    }

    await syncStripeSubscription(subscription);
    revalidateSubscriptions();
    return { ok: true };
  } catch (error) {
    return actionFailure("change users", error);
  }
}

export async function scheduleSubscriptionCancellation(
  subscriptionId: number,
): Promise<SubscriptionActionResult> {
  return setServiceCancellation(subscriptionId, true);
}

export async function resumeSubscription(
  subscriptionId: number,
): Promise<SubscriptionActionResult> {
  return setServiceCancellation(subscriptionId, false);
}

async function setServiceCancellation(
  subscriptionId: number,
  canceled: boolean,
): Promise<SubscriptionActionResult> {
  try {
    const owned = await getOwnedSubscription(subscriptionId);
    if (!owned.ok) return owned.result;
    const { row } = owned;
    if (!row.stripe_subscription_id || !row.stripe_subscription_item_id) {
      return { ok: false, code: "NOT_MAPPED" };
    }

    let subscription = await stripe.subscriptions.retrieve(
      row.stripe_subscription_id,
    );
    if (!isEditableStatus(subscription.status)) {
      return { ok: false, code: "NOT_EDITABLE" };
    }
    const currentItemIds = new Set(
      subscription.items.data.map((item) => item.id),
    );
    if (!currentItemIds.has(row.stripe_subscription_item_id)) {
      return { ok: false, code: "NOT_MAPPED" };
    }

    const scheduledItemIds = await getScheduledItemIds(
      subscription.id,
      row.id_compte,
    );
    if (canceled) scheduledItemIds.add(row.stripe_subscription_item_id);
    else scheduledItemIds.delete(row.stripe_subscription_item_id);

    const relevantCanceled = new Set(
      [...scheduledItemIds].filter((itemId) => currentItemIds.has(itemId)),
    );

    if (relevantCanceled.size === 0) {
      await releaseManagedSchedule(subscription);
      subscription = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: false,
      });
    } else if (relevantCanceled.size === currentItemIds.size) {
      await releaseManagedSchedule(subscription);
      subscription = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
      });
    } else {
      if (subscription.cancel_at_period_end) {
        subscription = await stripe.subscriptions.update(subscription.id, {
          cancel_at_period_end: false,
        });
      }
      await configureManagedSchedule(subscription, relevantCanceled);
      subscription = await stripe.subscriptions.retrieve(subscription.id);
    }

    await syncStripeSubscription(subscription);
    revalidateSubscriptions();
    return { ok: true };
  } catch (error) {
    return actionFailure(canceled ? "schedule cancellation" : "resume", error);
  }
}

async function getOwnedSubscription(id: number) {
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false as const, result: { ok: false as const, code: "NOT_FOUND" as const } };
  }
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, result: { ok: false as const, code: "AUTH_REQUIRED" as const } };
  }
  const { data, error } = await supabase
    .from("abonnement")
    .select(
      "id_abonnement, id_compte, stripe_subscription_id, stripe_subscription_item_id, annulation_programmee",
    )
    .eq("id_abonnement", id)
    .eq("id_compte", user.id)
    .maybeSingle();
  if (error || !data) {
    return { ok: false as const, result: { ok: false as const, code: "NOT_FOUND" as const } };
  }
  return { ok: true as const, row: data };
}

async function getScheduledItemIds(subscriptionId: string, accountId: string | null) {
  const supabase = await createServerClient();
  let query = supabase
    .from("abonnement")
    .select("stripe_subscription_item_id")
    .eq("stripe_subscription_id", subscriptionId)
    .eq("annulation_programmee", true);
  if (accountId) query = query.eq("id_compte", accountId);
  const { data, error } = await query;
  if (error) throw error;
  return new Set(
    (data ?? [])
      .map((entry) => entry.stripe_subscription_item_id)
      .filter((itemId): itemId is string => Boolean(itemId)),
  );
}

async function configureManagedSchedule(
  subscription: Stripe.Subscription,
  canceledItemIds: Set<string>,
  quantityOverrides: Record<string, number> = {},
) {
  let schedule: Stripe.SubscriptionSchedule;
  let createdSchedule = false;
  const scheduleId = stripeId(subscription.schedule);
  if (scheduleId) {
    schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
    assertManagedSchedule(schedule);
  } else {
    schedule = await stripe.subscriptionSchedules.create({
      from_subscription: subscription.id,
    });
    createdSchedule = true;
  }

  const start =
    schedule.current_phase?.start_date ?? currentPeriodStart(subscription);
  const end = currentPeriodEnd(subscription);
  const currentItems = subscription.items.data.map((item) => ({
    price: stripeId(item.price) as string,
    quantity: quantityOverrides[item.id] ?? item.quantity ?? 1,
  }));
  const futureItems = subscription.items.data
    .filter((item) => !canceledItemIds.has(item.id))
    .map((item) => ({
      price: stripeId(item.price) as string,
      quantity: quantityOverrides[item.id] ?? item.quantity ?? 1,
    }));
  if (futureItems.length === 0) {
    throw new Error("EMPTY_FUTURE_PHASE");
  }

  const interval = recurringInterval(subscription.items.data[0]);
  const sourcePhase = schedule.phases.find(
    (phase) => phase.start_date <= start && phase.end_date >= end,
  );
  const discounts = scheduleDiscounts(sourcePhase);
  try {
    await stripe.subscriptionSchedules.update(schedule.id, {
      end_behavior: "release",
      metadata: { cyna_managed: "true" },
      phases: [
        {
          ...(discounts.length > 0 ? { discounts } : {}),
          end_date: end,
          items: currentItems,
          proration_behavior: "none",
          start_date: start,
        },
        {
          ...(discounts.length > 0 ? { discounts } : {}),
          duration: interval,
          items: futureItems,
          proration_behavior: "none",
          start_date: end,
        },
      ],
      proration_behavior: "none",
    });
  } catch (error) {
    if (createdSchedule) {
      try {
        await stripe.subscriptionSchedules.release(schedule.id);
      } catch (cleanupError) {
        console.error(
          "[subscription-management] Could not release incomplete schedule",
          cleanupError,
        );
      }
    }
    throw error;
  }
}

function scheduleDiscounts(phase: Stripe.SubscriptionSchedule.Phase | undefined) {
  return (phase?.discounts ?? [])
    .map((entry) => {
      const coupon = stripeId(entry.coupon);
      const discount = stripeId(entry.discount);
      const promotionCode = stripeId(entry.promotion_code);
      if (discount) return { discount };
      if (promotionCode) return { promotion_code: promotionCode };
      if (coupon) return { coupon };
      return null;
    })
    .filter(
      (
        entry,
      ): entry is { coupon: string } | { discount: string } | { promotion_code: string } =>
        entry !== null,
    );
}

async function releaseManagedSchedule(subscription: Stripe.Subscription) {
  const scheduleId = stripeId(subscription.schedule);
  if (!scheduleId) return;
  const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
  assertManagedSchedule(schedule);
  if (["active", "not_started"].includes(schedule.status)) {
    await stripe.subscriptionSchedules.release(schedule.id);
  }
}

function assertManagedSchedule(schedule: Stripe.SubscriptionSchedule) {
  if (schedule.metadata?.cyna_managed !== "true") {
    throw new Error("EXTERNAL_SCHEDULE");
  }
}

function recurringInterval(item: Stripe.SubscriptionItem) {
  const price = item.price;
  if (typeof price === "string" || price.deleted || !price.recurring) {
    throw new Error("NOT_RECURRING");
  }
  return {
    interval: price.recurring.interval,
    interval_count: price.recurring.interval_count,
  };
}

function currentPeriodStart(subscription: Stripe.Subscription) {
  return Math.min(
    ...subscription.items.data.map(
      (item) => item.current_period_start ?? subscription.created,
    ),
  );
}

function currentPeriodEnd(subscription: Stripe.Subscription) {
  return Math.max(
    ...subscription.items.data.map((item) => item.current_period_end ?? 0),
  );
}

function isEditableStatus(status: Stripe.Subscription.Status) {
  return ["active", "trialing", "past_due"].includes(status);
}

function stripeId(value: string | { id: string } | null) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function revalidateSubscriptions() {
  revalidatePath("/[locale]/user-dashboard/purchases/subscriptions", "page");
  revalidatePath(
    "/[locale]/user-dashboard/purchases/orders/[id]/subscriptions",
    "page",
  );
}

function actionFailure(operation: string, error: unknown): SubscriptionActionResult {
  console.error(`[subscription-management] Could not ${operation}`, error);
  if (error instanceof Error && error.message === "EXTERNAL_SCHEDULE") {
    return { ok: false, code: "EXTERNAL_SCHEDULE" };
  }
  return { ok: false, code: "STRIPE_ERROR" };
}
