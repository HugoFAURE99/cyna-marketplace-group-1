"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Eye,
  XCircle,
  RefreshCw,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
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
import AdminBackButton from "@/components/admin/AdminBackButton";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import {
  isAnnualSubscriptionWithinOutlook,
  isSubscriptionDueWithinHorizon,
} from "@/lib/admin/subscription-health";
import type { Locale } from "@/lib/i18n/translations";
import { normalizeSubscriptionStatus } from "@/lib/subscriptions/status";
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
  tabAnnual: string;
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
  seats: string;
  scheduledEnding: string;
  operationError: string;
  statusTrialing: string;
  statusPastDue: string;
  statusPaused: string;
  statusIncomplete: string;
  statusIncompleteExpired: string;
  statusUnpaid: string;
}

const PAGE_SIZE = 10;
const PRODUCT_NAME_MAX_LENGTH = 8;

function compactProductName(value: string) {
  const characters = Array.from(value);
  return characters.length > PRODUCT_NAME_MAX_LENGTH
    ? `${characters.slice(0, PRODUCT_NAME_MAX_LENGTH).join("")}…`
    : value;
}

type SortDirection = "asc" | "desc" | null;
type SortKey =
  | "client"
  | "endDate"
  | "id"
  | "order"
  | "plan"
  | "price"
  | "product"
  | "seats"
  | "startDate"
  | "status";

function SortableHeader({
  active,
  direction,
  label,
  onClick,
  align = "left",
}: {
  active: boolean;
  direction: SortDirection;
  label: string;
  onClick: () => void;
  align?: "left" | "right";
}) {
  const Icon = active
    ? direction === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <TableHead
      aria-sort={
        active
          ? direction === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
      className={align === "right" ? "text-right" : undefined}
    >
      <button
        className={`inline-flex w-full items-center gap-1 whitespace-nowrap ${
          align === "right" ? "justify-end" : "justify-start"
        }`}
        onClick={onClick}
        type="button"
      >
        {label}
        <Icon
          aria-hidden="true"
          className={`size-3.5 ${active ? "text-foreground" : "text-muted-foreground/50"}`}
        />
      </button>
    </TableHead>
  );
}

function statusColor(statut: string): string {
  const s = normalizeSubscriptionStatus(statut);
  if (s === "active" || s === "trialing") return "bg-green-100 text-green-800";
  if (s === "canceled" || s === "incomplete_expired")
    return "bg-red-100 text-red-800";
  if (s === "past_due" || s === "incomplete" || s === "unpaid")
    return "bg-yellow-100 text-yellow-800";
  return "bg-gray-100 text-gray-700";
}

function translateStatus(raw: string, t: Translations): string {
  const labels: Record<string, string> = {
    active: t.statusActif,
    canceled: t.statusAnnule,
    incomplete: t.statusIncomplete,
    incomplete_expired: t.statusIncompleteExpired,
    past_due: t.statusPastDue,
    paused: t.statusPaused,
    trialing: t.statusTrialing,
    unpaid: t.statusUnpaid,
  };
  const status = normalizeSubscriptionStatus(raw);
  return labels[status] ?? status;
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
  initialDetail,
}: {
  subscriptions: SubscriptionRow[];
  translations: Translations;
  initialDetail?: SubscriptionDetail | null;
}) {
  const [tab, setTab] = useState<"all" | "expiring" | "annual">("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [billingFilter, setBillingFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [cancelTarget, setCancelTarget] = useState<SubscriptionRow | null>(null);
  const [bulkCancelOpen, setBulkCancelOpen] = useState(false);
  const [detail, setDetail] = useState<SubscriptionDetail | null>(
    initialDetail ?? null,
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState("");
  const router = useRouter();
  const tPagination = useTranslations("admin.pagination");
  const tSubscriptions = useTranslations("admin.subscriptions");
  const locale = useLocale() as Locale;

  const statusOptions = useMemo(() => {
    const set = new Set(
      subscriptions.map((subscription) =>
        normalizeSubscriptionStatus(subscription.statut_abonnement),
      ),
    );
    return Array.from(set).sort();
  }, [subscriptions]);

  const billingOptions = useMemo(() => {
    const set = new Set(subscriptions.map((s) => s.type_facturation).filter((t) => t !== "—"));
    return Array.from(set).sort();
  }, [subscriptions]);

  const filtered = useMemo(() => {
    let result = subscriptions;

    if (tab === "expiring") {
      result = result
        .filter((s) => isSubscriptionDueWithinHorizon(s.date_fin, s.statut_abonnement, 30))
        .sort((a, b) => (a.date_fin ?? "").localeCompare(b.date_fin ?? ""));
    }

    if (tab === "annual") {
      result = result
        .filter((subscription) =>
          isAnnualSubscriptionWithinOutlook(
            subscription.date_fin,
            subscription.statut_abonnement,
            subscription.type_facturation,
          ),
        )
        .sort((a, b) => (a.date_fin ?? "").localeCompare(b.date_fin ?? ""));
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
      result = result.filter(
        (s) => normalizeSubscriptionStatus(s.statut_abonnement) === statusFilter,
      );
    }

    if (billingFilter !== "all") {
      result = result.filter((s) => s.type_facturation === billingFilter);
    }

    return result;
  }, [subscriptions, tab, search, statusFilter, billingFilter]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDirection) return filtered;

    return [...filtered].sort((a, b) => {
      let aValue: number | string | null;
      let bValue: number | string | null;

      switch (sortKey) {
        case "id":
          aValue = a.id_abonnement;
          bValue = b.id_abonnement;
          break;
        case "order":
          aValue = a.id_commande;
          bValue = b.id_commande;
          break;
        case "client":
          aValue = a.client_name?.trim() || a.client_email;
          bValue = b.client_name?.trim() || b.client_email;
          break;
        case "product":
          aValue = a.produit_nom;
          bValue = b.produit_nom;
          break;
        case "plan":
          aValue = a.type_facturation;
          bValue = b.type_facturation;
          break;
        case "seats":
          aValue = a.nombre_utilisateurs;
          bValue = b.nombre_utilisateurs;
          break;
        case "price":
          aValue = a.prix * a.nombre_utilisateurs;
          bValue = b.prix * b.nombre_utilisateurs;
          break;
        case "startDate":
          aValue = a.date_debut;
          bValue = b.date_debut;
          break;
        case "endDate":
          aValue = a.date_fin;
          bValue = b.date_fin;
          break;
        case "status":
          aValue = normalizeSubscriptionStatus(a.statut_abonnement);
          bValue = normalizeSubscriptionStatus(b.statut_abonnement);
          break;
      }

      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      const comparison =
        typeof aValue === "number" && typeof bValue === "number"
          ? aValue - bValue
          : String(aValue).localeCompare(String(bValue), locale, {
              numeric: true,
              sensitivity: "base",
            });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filtered, locale, sortDirection, sortKey]);

  const handleSort = (key: SortKey) => {
    setPage(0);
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      setSortDirection("desc");
    } else {
      setSortKey(null);
      setSortDirection(null);
    }
  };

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleViewDetail = async (sub: SubscriptionRow) => {
    setDetailLoading(true);
    router.push(`/admin/subscriptions?detail=${sub.id_abonnement}`);
    const d = await getSubscriptionDetail(sub.id_abonnement, locale);
    setDetail(d);
    setDetailLoading(false);
  };

  const handleBack = () => {
    setDetail(null);
    router.back();
  };

  const handleReactivate = (id: number) => {
    setActionError("");
    startTransition(async () => {
      const result = await reactivateSubscription(id);
      if (!result.ok) setActionError(t.operationError);
      router.refresh();
    });
  };

  const handleCancelConfirm = () => {
    if (!cancelTarget) return;
    setActionError("");
    startTransition(async () => {
      const result = await cancelSubscription(cancelTarget.id_abonnement);
      if (result.ok) setCancelTarget(null);
      else setActionError(t.operationError);
      router.refresh();
    });
  };

  const handleBulkCancel = () => {
    setActionError("");
    startTransition(async () => {
      const result = await bulkCancelSubscriptions(Array.from(selectedIds));
      if (result.ok) {
        setSelectedIds(new Set());
        setBulkCancelOpen(false);
      } else setActionError(t.operationError);
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
        <AdminBackButton label={t.back} onClick={handleBack} />

        <h2 className="text-xl font-bold">
          {t.detailTitle} #{detail.id_abonnement}
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoCard label={t.client}><div className="text-sm"><p className="font-medium">{detail.client_name}</p><a className="break-all text-primary underline underline-offset-4" href={`mailto:${detail.client_email}`}>{detail.client_email}</a></div></InfoCard>
          <InfoCard label={t.product} value={detail.produit_nom} />
          <InfoCard label={t.plan} value={translateBilling(detail.type_facturation, t)} />
          <InfoCard label={t.seats} value={String(detail.nombre_utilisateurs)} />
          <InfoCard label={t.price} value={`${((detail.prix * detail.nombre_utilisateurs) / 100).toFixed(2)} €`} />
          <InfoCard label={t.startDate} value={new Date(detail.date_debut).toLocaleDateString(locale)} />
          <InfoCard
            label={t.endDate}
            value={detail.date_fin ? new Date(detail.date_fin).toLocaleDateString(locale) : t.noEndDate}
            highlight={isSubscriptionDueWithinHorizon(detail.date_fin, detail.statut_abonnement, 30)}
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
              <span>{new Date(detail.commande.date_commande).toLocaleDateString(locale)}</span>
              <span className="font-medium">{detail.commande.montant_total.toFixed(2)} €</span>
              <OrderStatusBadge status={detail.commande.statut_commande} />
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

        {normalizeSubscriptionStatus(detail.statut_abonnement) === "paused" ? (
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => handleReactivate(detail.id_abonnement)}
            disabled={isPending}
          >
            <RefreshCw className="mr-1 h-4 w-4" /> {t.reactivate}
          </Button>
        ) : !["canceled", "incomplete_expired"].includes(
            normalizeSubscriptionStatus(detail.statut_abonnement),
          ) ? (
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
        ) : null}
        {actionError && (
          <p className="text-sm font-medium text-destructive" role="alert">
            {actionError}
          </p>
        )}
      </div>
    );
  }

  // List view
  return (
    <>
      {/* Tabs */}
      <div className="mb-6 flex max-w-full overflow-x-auto border-b">
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
        <button
          type="button"
          onClick={() => { setTab("annual"); setPage(0); }}
          className={`whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors ${
            tab === "annual"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.tabAnnual}
        </button>
      </div>

      {/* Filters + Bulk actions */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <input
          type="text"
          placeholder={t.search}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring sm:max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:w-auto"
        >
          <option value="all">{t.allStatuses}</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>{translateStatus(s, t)}</option>
          ))}
        </select>
        <select
          value={billingFilter}
          onChange={(e) => { setBillingFilter(e.target.value); setPage(0); }}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:w-auto"
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
        {actionError && (
          <p className="w-full text-sm font-medium text-destructive" role="alert">
            {actionError}
          </p>
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
            <SortableHeader active={sortKey === "id"} direction={sortDirection} label={t.id} onClick={() => handleSort("id")} />
            <SortableHeader active={sortKey === "order"} direction={sortDirection} label={t.orderNumber} onClick={() => handleSort("order")} />
            <SortableHeader active={sortKey === "client"} direction={sortDirection} label={t.client} onClick={() => handleSort("client")} />
            <SortableHeader active={sortKey === "product"} direction={sortDirection} label={t.product} onClick={() => handleSort("product")} />
            <SortableHeader active={sortKey === "plan"} direction={sortDirection} label={t.plan} onClick={() => handleSort("plan")} />
            <SortableHeader active={sortKey === "seats"} align="right" direction={sortDirection} label={t.seats} onClick={() => handleSort("seats")} />
            <SortableHeader active={sortKey === "price"} align="right" direction={sortDirection} label={t.price} onClick={() => handleSort("price")} />
            <SortableHeader active={sortKey === "startDate"} direction={sortDirection} label={t.startDate} onClick={() => handleSort("startDate")} />
            <SortableHeader active={sortKey === "endDate"} direction={sortDirection} label={t.endDate} onClick={() => handleSort("endDate")} />
            <SortableHeader active={sortKey === "status"} direction={sortDirection} label={t.status} onClick={() => handleSort("status")} />
            <TableHead>{t.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.length === 0 ? (
            <TableRow>
              <TableCell colSpan={12} className="text-center text-muted-foreground">
                {t.noSubscriptions}
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((sub, index) => {
              const expiring = isSubscriptionDueWithinHorizon(sub.date_fin, sub.statut_abonnement, 30);
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
                  <TableCell className="w-44 max-w-44">
                    <div className="flex flex-col">
                      {sub.client_name && (
                        <span className="max-w-44 truncate text-sm font-medium" title={sub.client_name}>{sub.client_name}</span>
                      )}
                      <a className="block max-w-44 truncate text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline" href={`mailto:${sub.client_email}`} title={sub.client_email}>{sub.client_email}</a>
                    </div>
                  </TableCell>
                  <TableCell className="w-24 max-w-24 text-sm">
                    <span className="block max-w-24 truncate" title={sub.produit_nom}>{compactProductName(sub.produit_nom)}</span>
                  </TableCell>
                  <TableCell>
                    <BillingBadge type={sub.type_facturation} translations={t} />
                  </TableCell>
                  <TableCell className="text-sm text-right">{sub.nombre_utilisateurs}</TableCell>
                  <TableCell className="text-sm font-medium">{((sub.prix * sub.nombre_utilisateurs) / 100).toFixed(2)} €</TableCell>
                  <TableCell className="text-sm">
                    {new Date(sub.date_debut).toLocaleDateString(locale)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {sub.date_fin
                      ? new Date(sub.date_fin).toLocaleDateString(locale)
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(sub.statut_abonnement)}`}>
                        {translateStatus(sub.statut_abonnement, t)}
                      </span>
                      {sub.annulation_programmee && (
                        <span className="text-xs font-medium text-amber-700">
                          {t.scheduledEnding}
                        </span>
                      )}
                    </div>
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
                      {normalizeSubscriptionStatus(sub.statut_abonnement) === "paused" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReactivate(sub.id_abonnement)}
                          disabled={isPending}
                        >
                          <RefreshCw className="mr-1 h-3.5 w-3.5" /> {t.reactivate}
                        </Button>
                      ) : !["canceled", "incomplete_expired"].includes(
                          normalizeSubscriptionStatus(sub.statut_abonnement),
                        ) ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setCancelTarget(sub)}
                        >
                          <XCircle className="mr-1 h-3.5 w-3.5" /> {t.cancel}
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg sm:p-6">
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
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg sm:p-6">
            <Dialog.Title className="text-base font-semibold">
              {t.bulkCancelTitle}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              {tSubscriptions("bulkCancelMessage", { count: selectedIds.size })}
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
