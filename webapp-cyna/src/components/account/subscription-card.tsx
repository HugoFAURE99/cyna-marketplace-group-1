"use client";

import { Dialog } from "@base-ui/react/dialog";
import { ArrowRight, CalendarX2, ShieldCheck, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useNotification } from "@/components/ui/notification-provider";
import { formatPriceCents } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/translations";
import {
  changeSubscriptionUsers,
  resumeSubscription,
  scheduleSubscriptionCancellation,
  type SubscriptionActionResult,
} from "@/lib/stripe/subscription-management.action";

export type AccountSubscription = {
  id_abonnement: number;
  id_commande: number;
  statut_abonnement: string;
  date_debut: string;
  date_fin: string | null;
  nombre_utilisateurs: number;
  annulation_programmee: boolean;
  is_manageable: boolean;
  prix_tarif: {
    prix: number;
    type_facturation: string;
    prix_tarif_traduction?: { langue: string; nom_prix_tarif: string | null }[];
    produit?: {
      produit_traduction?: { langue: string; nom_pro: string }[];
    } | null;
  } | null;
  commande?: {
    date_commande: string;
    montant_total: number;
    statut_commande: string;
  } | null;
};

type DialogKind = "users" | "cancel" | "resume" | null;

export function SubscriptionCard({
  subscription,
}: {
  subscription: AccountSubscription;
}) {
  const t = useTranslations("subscriptions");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { notify } = useNotification();
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [quantity, setQuantity] = useState(subscription.nombre_utilisateurs);
  const [currentQuantity, setCurrentQuantity] = useState(
    subscription.nombre_utilisateurs,
  );
  const [scheduled, setScheduled] = useState(subscription.annulation_programmee);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productTranslations =
    subscription.prix_tarif?.produit?.produit_traduction ?? [];
  const tariffTranslations =
    subscription.prix_tarif?.prix_tarif_traduction ?? [];
  const productName = translatedValue(productTranslations, locale, "nom_pro");
  const tariffName = translatedValue(
    tariffTranslations,
    locale,
    "nom_prix_tarif",
  );
  const name = productName || tariffName || t("unknown");
  const normalizedStatus = subscription.statut_abonnement.toLowerCase();
  const editable =
    subscription.is_manageable &&
    ["active", "trialing", "past_due", "actif"].includes(normalizedStatus);
  const statusKey = scheduled ? "scheduled" : normalizedStatus;
  const knownStatuses = [
    "active",
    "trialing",
    "actif",
    "canceled",
    "incomplete",
    "incomplete_expired",
    "past_due",
    "unpaid",
    "paused",
    "scheduled",
  ];
  const statusLabel = knownStatuses.includes(statusKey)
    ? t(`statuses.${statusKey}` as Parameters<typeof t>[0])
    : subscription.statut_abonnement;
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const unitPrice = subscription.prix_tarif?.prix ?? null;
  const currentPrice = unitPrice === null ? null : unitPrice * currentQuantity;
  const nextPrice = unitPrice === null ? null : unitPrice * quantity;
  const period = billingPeriod(subscription.prix_tarif?.type_facturation, t);

  async function submitUsers() {
    setPending(true);
    setError(null);
    const result = await changeSubscriptionUsers(
      subscription.id_abonnement,
      quantity,
    );
    setPending(false);
    if (!result.ok) return showError(result);
    setCurrentQuantity(quantity);
    setDialog(null);
    notify(t("usersUpdated"));
    router.refresh();
  }

  async function submitCancellation(cancel: boolean) {
    setPending(true);
    setError(null);
    const result = cancel
      ? await scheduleSubscriptionCancellation(subscription.id_abonnement)
      : await resumeSubscription(subscription.id_abonnement);
    setPending(false);
    if (!result.ok) return showError(result);
    setScheduled(cancel);
    setDialog(null);
    notify(cancel ? t("cancellationScheduled") : t("subscriptionKept"));
    router.refresh();
  }

  function showError(result: Extract<SubscriptionActionResult, { ok: false }>) {
    setError(t(`errors.${result.code}` as Parameters<typeof t>[0]));
  }

  return (
    <article className="flex h-full min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-purple-200 hover:shadow-md">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
          <ShieldCheck aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-bold text-slate-950">{name}</h2>
          {productName && tariffName && tariffName !== productName && (
            <p className="mt-0.5 truncate text-xs text-slate-500">{tariffName}</p>
          )}
        </div>
        <StatusBadge status={statusKey} label={statusLabel} />
      </div>

      <div className="mt-5">
        {currentPrice !== null && (
          <div className="flex items-baseline gap-1.5">
            <p className="text-xl font-bold tracking-tight text-purple-800">
              {formatPriceCents(currentPrice, locale)}
            </p>
            {period && <span className="text-xs text-slate-500">{period}</span>}
          </div>
        )}
        <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
          <Users aria-hidden="true" className="size-4 text-purple-600" />
          {t("userCount", { count: currentQuantity })}
        </p>
      </div>

      <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-xs text-slate-500">
        <div className="flex justify-between gap-3">
          <dt>{t("started")}</dt>
          <dd className="font-medium text-slate-700">
            {date.format(new Date(subscription.date_debut))}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>{scheduled ? t("ends") : t("nextRenewal")}</dt>
          <dd className="font-medium text-slate-700">
            {subscription.date_fin
              ? date.format(new Date(subscription.date_fin))
              : t("ongoing")}
          </dd>
        </div>
      </dl>

      {editable && (
        <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <button
            className="rounded-md bg-purple-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={scheduled}
            onClick={() => {
              setQuantity(currentQuantity);
              setDialog("users");
            }}
            type="button"
          >
            {t("changeUsers")}
          </button>
          <button
            className={
              scheduled
                ? "rounded-md border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-800 transition hover:bg-purple-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700"
                : "inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            }
            onClick={() => setDialog(scheduled ? "resume" : "cancel")}
            type="button"
          >
            {!scheduled && <CalendarX2 aria-hidden="true" className="size-3.5" />}
            {scheduled ? t("keepSubscription") : t("cancelAtPeriodEnd")}
          </button>
        </div>
      )}

      {error && (
        <p className="mt-3 text-xs text-amber-800" role="alert">
          {error}
        </p>
      )}

      <Dialog.Root
        onOpenChange={(open) => {
          if (!open && !pending) setDialog(null);
        }}
        open={dialog !== null}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-[1px]" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-6 shadow-xl focus:outline-none">
            <Dialog.Title className="text-lg font-bold text-slate-950">
              {dialog === "users"
                ? t("changeUsersTitle")
                : dialog === "cancel"
                  ? t("cancelTitle")
                  : t("resumeTitle")}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-6 text-slate-600">
              {dialog === "users"
                ? t("changeUsersDescription")
                : dialog === "cancel"
                  ? t("cancelDescription")
                  : t("resumeDescription")}
            </Dialog.Description>

            {dialog === "users" && (
              <>
                <label className="mt-5 block text-sm font-semibold text-slate-800">
                  {t("usersLabel")}
                  <input
                    autoFocus
                    className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-base outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                    max={50}
                    min={1}
                    onChange={(event) => setQuantity(Number(event.target.value))}
                    type="number"
                    value={quantity}
                  />
                </label>
                {currentPrice !== null && nextPrice !== null && (
                  <div className="mt-5 rounded-lg border border-purple-100 bg-purple-50/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">
                      {t("nextRenewalPrice")}
                    </p>
                    <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div>
                        <p className="text-xs text-slate-500">{t("currentPrice")}</p>
                        <del className="mt-1 block text-base font-semibold text-slate-500 decoration-slate-400">
                          {formatPriceCents(currentPrice, locale)}{period}
                        </del>
                      </div>
                      <ArrowRight aria-hidden="true" className="size-4 text-purple-400" />
                      <div className="text-right">
                        <p className="text-xs text-purple-700">{t("newPrice")}</p>
                        <p className="mt-1 text-lg font-bold text-purple-800">
                          {formatPriceCents(nextPrice, locale)}{period}
                        </p>
                      </div>
                    </div>
                    {unitPrice !== null && (
                      <p className="mt-3 border-t border-purple-100 pt-3 text-xs text-slate-600">
                        {t("priceCalculation", {
                          count: quantity,
                          unitPrice: formatPriceCents(unitPrice, locale),
                        })}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <Dialog.Close
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 disabled:opacity-50"
                disabled={pending}
              >
                {t("cancel")}
              </Dialog.Close>
              <button
                className={`rounded-md px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 ${dialog === "cancel" ? "bg-red-700 hover:bg-red-800 focus-visible:ring-red-700" : "bg-purple-700 hover:bg-purple-800 focus-visible:ring-purple-700"}`}
                disabled={
                  pending ||
                  (dialog === "users" &&
                    (quantity < 1 ||
                      quantity > 50 ||
                      quantity === currentQuantity))
                }
                onClick={() => {
                  if (dialog === "users") void submitUsers();
                  else void submitCancellation(dialog === "cancel");
                }}
                type="button"
              >
                {pending ? t("saving") : t("confirm")}
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </article>
  );
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const classes =
    status === "active" || status === "trialing" || status === "actif"
      ? "bg-purple-100 text-purple-800"
      : status === "scheduled"
        ? "border border-purple-200 bg-purple-50 text-purple-800"
        : status === "past_due" || status === "unpaid"
          ? "bg-amber-100 text-amber-900"
          : "bg-slate-100 text-slate-700";
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${classes}`}>
      {label}
    </span>
  );
}

export function subscriptionDisplayName(
  subscription: AccountSubscription,
  locale: string,
) {
  return (
    translatedValue(
      subscription.prix_tarif?.produit?.produit_traduction ?? [],
      locale,
      "nom_pro",
    ) ??
    translatedValue(
      subscription.prix_tarif?.prix_tarif_traduction ?? [],
      locale,
      "nom_prix_tarif",
    ) ??
    ""
  );
}

function billingPeriod(
  type: string | undefined,
  t: ReturnType<typeof useTranslations<"subscriptions">>,
) {
  if (type === "mensuel") return t("perMonth");
  if (type === "annuel") return t("perYear");
  return "";
}

function translatedValue<T extends { langue: string }>(
  items: T[],
  locale: string,
  key: keyof T,
) {
  const row =
    items.find((item) => item.langue === locale) ??
    items.find((item) => item.langue === "fr") ??
    items[0];
  const value = row?.[key];
  return typeof value === "string" ? value : undefined;
}
