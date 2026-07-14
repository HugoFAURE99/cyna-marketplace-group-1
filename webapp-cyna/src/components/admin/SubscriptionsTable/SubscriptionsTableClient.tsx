"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Eye,
  XCircle,
  RefreshCw,
  ArrowLeft,
  ChevronDown,
  Loader2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@base-ui/react/dialog";
import Spinner from "@/components/ui/spinner";
import {
  cancelSubscription,
  reactivateSubscription,
  bulkCancelSubscriptions,
  getSubscriptionDetail,
  type SubscriptionRow,
  type SubscriptionDetail,
} from "@/app/[locale]/(admin)/admin/_actions/subscription.actions";

interface Translations {
  title: string;
  tabAll: string;
  tabExpiring: string;
  search: string;
  allStatuses: string;
  allBillingTypes: string;
  id: string;
  orderNumber: string;
  client: string;
  product: string;
  plan: string;
  price: string;
  startDate: string;
  endDate: string;
  status: string;
  actions: string;
  noSubscriptions: string;
  view: string;
  cancel: string;
  cancelTitle: string;
  cancelMessage: string;
  confirmCancel: string;
  cancelDeleteBtn: string;
  cancelling: string;
  bulkCancel: string;
  bulkCancelTitle: string;
  bulkCancelMessage: string;
  selected: string;
  selectAll: string;
  back: string;
  detailTitle: string;
  linkedOrder: string;
  viewOrder: string;
  stripeId: string;
  noEndDate: string;
  loading: string;
  statusActif: string;
  statusAnnule: string;
  statusExpire: string;
  billingMensuel: string;
  billingAnnuel: string;
  reactivate: string;
}

const PAGE_SIZE = 10;

function isExpiringThisMonth(dateFin: string | null): boolean {
  if (!dateFin) return false;
  const end = new Date(dateFin);
  const now = new Date();
  return (
    end.getFullYear() === now.getFullYear() &&
    end.getMonth() === now.getMonth()
  );
}

function statusColor(statut: string): string {
  const s = statut.toLowerCase();
  if (s === "actif" || s === "active") return "bg-green-100 text-green-800";
  if (s === "annulé" || s === "cancelled" || s === "canceled")
    return "bg-red-100 text-red-800";
  if (s === "expiré" || s === "expired") return "bg-gray-100 text-gray-600";
  if (s === "en attente" || s === "pending")
    return "bg-yellow-100 text-yellow-800";
  return "bg-gray-100 text-gray-700";
}

function translateStatus(raw: string, t: Translations): string {
  const s = raw.toLowerCase();
  if (s === "actif" || s === "active") return t.statusActif;
  if (s === "annulé" || s === "cancelled" || s === "canceled") return t.statusAnnule;
  if (s === "expiré" || s === "expired") return t.statusExpire;
  return raw;
}

function translateBilling(raw: string, t: Translations): string {
  const s = raw.toLowerCase();
  if (s === "mensuel" || s === "monthly") return t.billingMensuel;
  if (s === "annuel" || s === "annual" || s === "yearly") return t.billingAnnuel;
  return raw;
}

export default function SubscriptionsTableClient({
  subscriptions,
  translations: t,
  initialDetailId,
}: {
  subscriptions: SubscriptionRow[];
  translations: Translations;
  initialDetailId?: string;
}) {
  const [tab, setTab] = useState<"all" | "expiring">("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [billingFilter, setBillingFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [cancelTarget, setCancelTarget] = useState<SubscriptionRow | null>(null);
  const [bulkCancelOpen, setBulkCancelOpen] = useState(false);
  const [detail, setDetail] = useState<SubscriptionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const tPagination = useTranslations("admin.pagination");

  // Load initial detail if provided via URL
  useState(() => {
    if (initialDetailId) {
      const id = parseInt(initialDetailId, 10);
      if (!isNaN(id)) {
        setDetailLoading(true);
        getSubscriptionDetail(id).then((d) => {
          setDetail(d);
          setDetailLoading(false);
        });
      }
    }
  });

  const statusOptions = useMemo(() => {
    const set = new Set(subscriptions.map((s) => s.statut_abonnement));
    return Array.from(set).sort();
  }, [subscriptions]);

  const billingOptions = useMemo(() => {
    const set = new Set(subscriptions.map((s) => s.type_facturation).filter((t) => t !== "—"));
    return Array.from(set).sort();
  }, [subscriptions]);

  const filtered = useMemo(() => {
    let result = subscriptions;

    if (tab === "expiring") {
      result = result.filter((s) => isExpiringThisMonth(s.date_fin));
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          String(s.id_abonnement).includes(q) ||
          String(s.id_commande).includes(q) ||
          s.client_email.toLowerCase().includes(q) ||
          (s.client_name && s.client_name.toLowerCase().includes(q)) ||
          s.produit_nom.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((s) => s.statut_abonnement === statusFilter);
    }

    if (billingFilter !== "all") {
      result = result.filter((s) => s.type_facturation === billingFilter);
    }

    return result;
  }, [subscriptions, tab, search, statusFilter, billingFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleViewDetail = async (sub: SubscriptionRow) => {
    setDetailLoading(true);
    router.push(`/admin/subscriptions?detail=${sub.id_abonnement}`);
    const d = await getSubscriptionDetail(sub.id_abonnement);
    setDetail(d);
    setDetailLoading(false);
  };

  const handleBack = () => {
    setDetail(null);
    router.back();
  };

  const isCancelled = (statut: string) => {
    const s = statut.toLowerCase();
    return s === "annulé" || s === "cancelled" || s === "canceled";
  };

  const handleReactivate = (id: number) => {
    startTransition(async () => {
      await reactivateSubscription(id);
      router.refresh();
    });
  };

  const handleCancelConfirm = () => {
    if (!cancelTarget) return;
    startTransition(async () => {
      await cancelSubscription(cancelTarget.id_abonnement);
      setCancelTarget(null);
      router.refresh();
    });
  };

  const handleBulkCancel = () => {
    startTransition(async () => {
      await bulkCancelSubscriptions(Array.from(selectedIds));
      setSelectedIds(new Set());
      setBulkCancelOpen(false);
      router.refresh();
    });
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((s) => s.id_abonnement)));
    }
  };

  // Detail view
  if (detail || detailLoading) {
    if (detailLoading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <Spinner /> <span className="ml-2 text-sm text-muted-foreground">{t.loading}</span>
        </div>
      );
    }

    if (!detail) return null;

    return (
      <div className="flex flex-col gap-6">
        <Button variant="outline" size="sm" onClick={handleBack} className="w-fit">
          <ArrowLeft className="mr-1 h-4 w-4" /> {t.back}
        </Button>

        <h2 className="text-xl font-bold">
          {t.detailTitle} #{detail.id_abonnement}
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoCard label={t.client} value={detail.client_name ? `${detail.client_name} (${detail.client_email})` : detail.client_email} />
          <InfoCard label={t.product} value={detail.produit_nom} />
          <InfoCard label={t.plan} value={translateBilling(detail.type_facturation, t)} />
          <InfoCard label={t.price} value={`${(detail.prix / 100).toFixed(2)} €`} />
          <InfoCard label={t.startDate} value={new Date(detail.date_debut).toLocaleDateString("fr-FR")} />
          <InfoCard
            label={t.endDate}
            value={detail.date_fin ? new Date(detail.date_fin).toLocaleDateString("fr-FR") : t.noEndDate}
            highlight={detail.date_fin ? isExpiringThisMonth(detail.date_fin) : false}
          />
          <InfoCard label={t.status}>
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(detail.statut_abonnement)}`}>
              {translateStatus(detail.statut_abonnement, t)}
            </span>
          </InfoCard>
          {detail.stripe_subscription_id && (
            <InfoCard label={t.stripeId} value={detail.stripe_subscription_id} />
          )}
        </div>

        {detail.commande && (
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold">{t.linkedOrder}</h3>
            <div className="flex items-center gap-4 text-sm">
              <span>#{detail.commande.id_commande}</span>
              <span>{new Date(detail.commande.date_commande).toLocaleDateString("fr-FR")}</span>
              <span className="font-medium">{detail.commande.montant_total.toFixed(2)} €</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(detail.commande.statut_commande)}`}>
                {detail.commande.statut_commande}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/admin/orders?detail=${detail.commande!.id_commande}`)}
              >
                {t.viewOrder}
              </Button>
            </div>
          </div>
        )}

        {isCancelled(detail.statut_abonnement) ? (
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => handleReactivate(detail.id_abonnement)}
            disabled={isPending}
          >
            <RefreshCw className="mr-1 h-4 w-4" /> {t.reactivate}
          </Button>
        ) : (
          <Button
            variant="destructive"
            size="sm"
            className="w-fit"
            onClick={() =>
              setCancelTarget({
                ...detail,
              } as SubscriptionRow)
            }
          >
            <XCircle className="mr-1 h-4 w-4" /> {t.cancel}
          </Button>
        )}
      </div>
    );
  }

  // List view
  return (
    <>
      {/* Tabs */}
      <div className="mb-6 flex border-b">
        <button
          type="button"
          onClick={() => { setTab("all"); setPage(0); }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === "all"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.tabAll}
        </button>
        <button
          type="button"
          onClick={() => { setTab("expiring"); setPage(0); }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === "expiring"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.tabExpiring}
        </button>
      </div>

      {/* Filters + Bulk actions */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <input
          type="text"
          placeholder={t.search}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="w-full max-w-xs rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="all">{t.allStatuses}</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>{translateStatus(s, t)}</option>
          ))}
        </select>
        <select
          value={billingFilter}
          onChange={(e) => { setBillingFilter(e.target.value); setPage(0); }}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="all">{t.allBillingTypes}</option>
          {billingOptions.map((b) => (
            <option key={b} value={b}>{translateBilling(b, t)}</option>
          ))}
        </select>

        {selectedIds.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setBulkCancelOpen(true)}
          >
            <XCircle className="mr-1 h-3.5 w-3.5" />
            {t.bulkCancel} ({selectedIds.size})
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={paginated.length > 0 && selectedIds.size === paginated.length}
                onChange={toggleSelectAll}
                className="rounded border-gray-300"
              />
            </TableHead>
            <TableHead>{t.id}</TableHead>
            <TableHead>{t.orderNumber}</TableHead>
            <TableHead>{t.client}</TableHead>
            <TableHead>{t.product}</TableHead>
            <TableHead>{t.plan}</TableHead>
            <TableHead>{t.price}</TableHead>
            <TableHead>{t.startDate}</TableHead>
            <TableHead>{t.endDate}</TableHead>
            <TableHead>{t.status}</TableHead>
            <TableHead>{t.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center text-muted-foreground">
                {t.noSubscriptions}
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((sub, index) => {
              const expiring = isExpiringThisMonth(sub.date_fin);
              return (
                <TableRow
                  key={sub.id_abonnement}
                  className={`${expiring ? "bg-red-50" : index % 2 === 1 ? "bg-muted/20" : ""}`}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(sub.id_abonnement)}
                      onChange={() => toggleSelect(sub.id_abonnement)}
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">#{sub.id_abonnement}</TableCell>
                  <TableCell className="font-mono text-xs">#{sub.id_commande}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      {sub.client_name && (
                        <span className="text-sm font-medium">{sub.client_name}</span>
                      )}
                      <span className="text-xs text-muted-foreground">{sub.client_email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{sub.produit_nom}</TableCell>
                  <TableCell>
                    <BillingBadge type={sub.type_facturation} translations={t} />
                  </TableCell>
                  <TableCell className="text-sm font-medium">{(sub.prix / 100).toFixed(2)} €</TableCell>
                  <TableCell className="text-sm">
                    {new Date(sub.date_debut).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell className="text-sm">
                    {sub.date_fin
                      ? new Date(sub.date_fin).toLocaleDateString("fr-FR")
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(sub.statut_abonnement)}`}>
                      {translateStatus(sub.statut_abonnement, t)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetail(sub)}
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" /> {t.view}
                      </Button>
                      {isCancelled(sub.statut_abonnement) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReactivate(sub.id_abonnement)}
                          disabled={isPending}
                        >
                          <RefreshCw className="mr-1 h-3.5 w-3.5" /> {t.reactivate}
                        </Button>
                      ) : (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setCancelTarget(sub)}
                        >
                          <XCircle className="mr-1 h-3.5 w-3.5" /> {t.cancel}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {tPagination("info", {
              from: page * PAGE_SIZE + 1,
              to: Math.min((page + 1) * PAGE_SIZE, filtered.length),
              total: filtered.length,
            })}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              {tPagination("previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              {tPagination("next")}
            </Button>
          </div>
        </div>
      )}

      {/* Cancel confirmation dialog */}
      <Dialog.Root
        open={cancelTarget !== null && !bulkCancelOpen}
        onOpenChange={(open) => { if (!open) setCancelTarget(null); }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/20 supports-backdrop-filter:backdrop-blur-xs" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-popover p-6 text-popover-foreground shadow-lg">
            <Dialog.Title className="text-base font-semibold">
              {t.cancelTitle}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              {t.cancelMessage}
            </Dialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close render={<Button variant="outline" size="sm" />}>
                {t.cancelDeleteBtn}
              </Dialog.Close>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancelConfirm}
                disabled={isPending}
              >
                {isPending ? (
                  <><Spinner /> {t.cancelling}</>
                ) : (
                  t.confirmCancel
                )}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Bulk cancel dialog */}
      <Dialog.Root
        open={bulkCancelOpen}
        onOpenChange={(open) => { if (!open) setBulkCancelOpen(false); }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/20 supports-backdrop-filter:backdrop-blur-xs" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-popover p-6 text-popover-foreground shadow-lg">
            <Dialog.Title className="text-base font-semibold">
              {t.bulkCancelTitle}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              {t.bulkCancelMessage.replace("{count}", String(selectedIds.size))}
            </Dialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close render={<Button variant="outline" size="sm" />}>
                {t.cancelDeleteBtn}
              </Dialog.Close>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkCancel}
                disabled={isPending}
              >
                {isPending ? (
                  <><Spinner /> {t.cancelling}</>
                ) : (
                  t.confirmCancel
                )}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function BillingBadge({ type, translations }: { type: string; translations: Translations }) {
  const raw = type.toLowerCase();
  const isAnnual = raw.includes("annuel") || raw.includes("annual") || raw.includes("year");
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isAnnual
          ? "bg-primary/15 text-primary"
          : "bg-amber-100 text-amber-700"
      }`}
    >
      {translateBilling(type, translations)}
    </span>
  );
}

function InfoCard({
  label,
  value,
  children,
  highlight = false,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? "border-red-200 bg-red-50" : "bg-card"}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      {children || <p className="mt-0.5 text-sm font-medium">{value}</p>}
    </div>
  );
}
