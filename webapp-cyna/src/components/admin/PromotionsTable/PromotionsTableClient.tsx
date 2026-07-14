"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Eye, Trash2 } from "lucide-react";
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
  togglePromotionStatus,
  canDeletePromotion,
  deletePromotion,
  type PromotionRow,
} from "@/app/[locale]/(admin)/admin/_actions/promotion.actions";

interface Translations {
  title: string;
  add: string;
  search: string;
  allStatuses: string;
  active: string;
  inactive: string;
  allTypes: string;
  percentage: string;
  fixed: string;
  id: string;
  type: string;
  value: string;
  expiration: string;
  status: string;
  code: string;
  targets: string;
  actions: string;
  noPromotions: string;
  view: string;
  delete: string;
  confirmDeleteTitle: string;
  confirmDeleteMessage: string;
  confirmDelete: string;
  cancelDelete: string;
  deleting: string;
  cannotDeleteTitle: string;
  cannotDeleteMessage: string;
  deactivateInstead: string;
  close: string;
  automatic: string;
  codePromo: string;
  products: string;
  categories: string;
}

const PAGE_SIZE = 10;

export default function PromotionsTableClient({
  promotions,
  translations: t,
}: {
  promotions: PromotionRow[];
  translations: Translations;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<PromotionRow | null>(null);
  const [cannotDelete, setCannotDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const tPagination = useTranslations("admin.pagination");

  const filtered = useMemo(() => {
    let result = promotions;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          String(p.id_promotion).includes(q) ||
          (p.code_promo && p.code_promo.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((p) =>
        statusFilter === "active" ? p.is_actif : !p.is_actif
      );
    }

    if (typeFilter !== "all") {
      result = result.filter((p) => p.type_remise === typeFilter);
    }

    return result;
  }, [promotions, search, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleToggleStatus = (promo: PromotionRow) => {
    startTransition(async () => {
      await togglePromotionStatus(promo.id_promotion, !promo.is_actif);
      router.refresh();
    });
  };

  const handleDeleteClick = async (promo: PromotionRow) => {
    const ok = await canDeletePromotion(promo.id_promotion);
    if (ok) {
      setDeleteTarget(promo);
      setCannotDelete(false);
    } else {
      setDeleteTarget(promo);
      setCannotDelete(true);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deletePromotion(deleteTarget.id_promotion);
      setDeleteTarget(null);
      router.refresh();
    });
  };

  const handleDeactivate = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      await togglePromotionStatus(deleteTarget.id_promotion, false);
      setDeleteTarget(null);
      setCannotDelete(false);
      router.refresh();
    });
  };

  const formatValue = (promo: PromotionRow) => {
    if (promo.type_remise === "pourcentage") return `${promo.valeur_remise}%`;
    return `${promo.valeur_remise.toFixed(2)} €`;
  };

  const formatTargets = (promo: PromotionRow) => {
    const parts: string[] = [];
    if (promo.produits.length > 0) {
      parts.push(`${promo.produits.length} ${t.products.toLowerCase()}`);
    }
    if (promo.categories.length > 0) {
      parts.push(`${promo.categories.length} ${t.categories.toLowerCase()}`);
    }
    return parts.join(", ") || "—";
  };

  return (
    <>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <input
          type="text"
          placeholder={t.search}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="w-full max-w-xs rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="all">{t.allStatuses}</option>
          <option value="active">{t.active}</option>
          <option value="inactive">{t.inactive}</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(0);
          }}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="all">{t.allTypes}</option>
          <option value="pourcentage">{t.percentage}</option>
          <option value="fixe">{t.fixed}</option>
        </select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.id}</TableHead>
            <TableHead>{t.type}</TableHead>
            <TableHead>{t.value}</TableHead>
            <TableHead>{t.expiration}</TableHead>
            <TableHead>{t.code}</TableHead>
            <TableHead>{t.targets}</TableHead>
            <TableHead>{t.status}</TableHead>
            <TableHead>{t.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                {t.noPromotions}
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((promo, index) => (
              <TableRow
                key={promo.id_promotion}
                className={index % 2 === 1 ? "bg-muted/20" : ""}
              >
                <TableCell className="font-mono text-xs">#{promo.id_promotion}</TableCell>
                <TableCell>
                  {promo.type_remise === "pourcentage" ? t.percentage : t.fixed}
                </TableCell>
                <TableCell className="font-medium">{formatValue(promo)}</TableCell>
                <TableCell>
                  {new Date(promo.date_expiration).toLocaleDateString("fr-FR")}
                </TableCell>
                <TableCell>
                  {promo.is_code_promo ? (
                    <span className="inline-block rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                      {promo.code_promo || "—"}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t.automatic}</span>
                  )}
                </TableCell>
                <TableCell className="text-xs">{formatTargets(promo)}</TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(promo)}
                    disabled={isPending}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${promo.is_actif ? "bg-primary" : "bg-muted"}`}
                  >
                    <span
                      className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${promo.is_actif ? "translate-x-4" : "translate-x-0"}`}
                    />
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/promotions/${promo.id_promotion}`)}
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      {t.view}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(promo)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      {t.delete}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
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

      {/* Delete confirmation dialog */}
      <Dialog.Root
        open={deleteTarget !== null && !cannotDelete}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/20 supports-backdrop-filter:backdrop-blur-xs" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-popover p-6 text-popover-foreground shadow-lg">
            <Dialog.Title className="text-base font-semibold">
              {t.confirmDeleteTitle}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              {t.confirmDeleteMessage}
            </Dialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close render={<Button variant="outline" size="sm" />}>
                {t.cancelDelete}
              </Dialog.Close>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Spinner /> {t.deleting}
                  </>
                ) : (
                  t.confirmDelete
                )}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Cannot delete dialog — propose deactivation */}
      <Dialog.Root
        open={deleteTarget !== null && cannotDelete}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setCannotDelete(false);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/20 supports-backdrop-filter:backdrop-blur-xs" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-popover p-6 text-popover-foreground shadow-lg">
            <Dialog.Title className="text-base font-semibold">
              {t.cannotDeleteTitle}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              {t.cannotDeleteMessage}
            </Dialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close render={<Button variant="outline" size="sm" />}>
                {t.close}
              </Dialog.Close>
              <Button
                size="sm"
                onClick={handleDeactivate}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Spinner /> ...
                  </>
                ) : (
                  t.deactivateInstead
                )}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
