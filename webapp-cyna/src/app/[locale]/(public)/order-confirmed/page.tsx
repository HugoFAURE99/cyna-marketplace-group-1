import { CheckCircle2, FileText, PackageCheck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import ClearCart from "@/components/home/ClearCart";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/i18n/translations";
import { createAdminClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase/server-client";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

type OrderLine = {
  id_prix: number;
  prix_unitaire: number;
  quantite: number;
  sous_total: number;
  prix_tarif: {
    produit: {
      produit_traduction: { langue: string; nom_pro: string }[];
    } | null;
  } | null;
};

export default async function OrderConfirmedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { locale } = await params;
  const { session_id: sessionId } = await searchParams;
  setRequestLocale(locale);
  if (!sessionId || !sessionId.startsWith("cs_")) notFound();

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    notFound();
  }
  if (
    session.status !== "complete" ||
    !["paid", "no_payment_required"].includes(session.payment_status)
  ) {
    notFound();
  }

  const orderId = Number(session.metadata?.id_commande);
  if (!Number.isInteger(orderId) || orderId <= 0) notFound();

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const sessionAccountId = session.metadata?.id_compte;
  if (
    user &&
    sessionAccountId &&
    sessionAccountId !== "invite" &&
    sessionAccountId !== user.id
  ) {
    notFound();
  }

  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("commande")
    .select(`
      id_commande, date_commande, montant_total, statut_commande,
      ligne_commande (
        id_prix, prix_unitaire, quantite, sous_total,
        prix_tarif (
          produit (
            produit_traduction (langue, nom_pro)
          )
        )
      )
    `)
    .eq("id_commande", orderId)
    .eq("stripe_checkout_session_id", sessionId)
    .single();
  if (error || !order) notFound();

  const lines = order.ligne_commande as unknown as OrderLine[];
  const t = await getTranslations("orderConfirmed");
  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  });

  return (
    <main className="flex-1 bg-slate-50/60">
      <ClearCart />
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 px-6 py-8 text-center sm:px-10">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-purple-50 text-purple-700">
              <CheckCircle2 aria-hidden="true" className="size-8" />
            </span>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
              {t("title")}
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
              {t("subtitle")}
            </p>
          </header>

          <div className="space-y-8 px-6 py-8 sm:px-10">
            <dl className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-slate-500">{t("orderNumber")}</dt>
                <dd className="mt-1 font-semibold text-slate-950">#{order.id_commande}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("date")}</dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  {new Date(order.date_commande).toLocaleDateString(locale)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("status")}</dt>
                <dd className="mt-1 font-semibold text-purple-700">{t("paid")}</dd>
              </div>
            </dl>

            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
                <PackageCheck aria-hidden="true" className="size-5 text-purple-700" />
                {t("summary")}
              </h2>
              <ul className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
                {lines.map((line) => {
                  const translations = line.prix_tarif?.produit?.produit_traduction ?? [];
                  const name =
                    translations.find((item) => item.langue === locale)?.nom_pro ??
                    translations.find((item) => item.langue === "fr")?.nom_pro ??
                    t("productFallback");
                  return (
                    <li className="flex items-start justify-between gap-4 px-4 py-4" key={line.id_prix}>
                      <div>
                        <p className="font-medium text-slate-900">{name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {t("licenses", { count: line.quantite })}
                        </p>
                      </div>
                      <p className="shrink-0 font-semibold text-slate-900">
                        {money.format(Number(line.sous_total))}
                      </p>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 flex items-center justify-between text-lg font-bold text-slate-950">
                <span>{t("total")}</span>
                <span>{money.format(Number(order.montant_total))}</span>
              </div>
            </div>

            <p className="flex items-start gap-2 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              <FileText aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-purple-700" />
              {t("invoiceNote")}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              {user ? (
                <>
                  <Link className="inline-flex h-11 flex-1 items-center justify-center rounded-md bg-purple-700 px-5 text-sm font-semibold text-white hover:bg-purple-800" href="/user-dashboard/orders">
                    {t("viewOrders")}
                  </Link>
                  <Link className="inline-flex h-11 flex-1 items-center justify-center rounded-md border border-purple-700 px-5 text-sm font-semibold text-purple-700 hover:bg-purple-50" href="/user-dashboard/subscriptions">
                    {t("viewSubscriptions")}
                  </Link>
                </>
              ) : (
                <>
                  <Link className="inline-flex h-11 flex-1 items-center justify-center rounded-md bg-purple-700 px-5 text-sm font-semibold text-white hover:bg-purple-800" href="/login">
                    {t("signIn")}
                  </Link>
                  <Link className="inline-flex h-11 flex-1 items-center justify-center rounded-md border border-purple-700 px-5 text-sm font-semibold text-purple-700 hover:bg-purple-50" href="/register">
                    {t("createAccount")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
