"use client";

import { useState, useMemo, useTransition, useEffect } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Eye, ExternalLink, ShieldOff } from "lucide-react";
import { Link } from "@/i18n/navigation";
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
  toggleUserStatus,
  updateUserRole,
  deleteUser,
  getUserDetail,
  resetUserMfa,
  type UserDetail,
} from "@/app/[locale]/(admin)/admin/_actions/user.actions";

interface User {
  id_compte: string;
  adresse_mail: string;
  nom_complet: string;
  role: string;
  is_actif: boolean;
}

interface Translations {
  title: string;
  search: string;
  name: string;
  email: string;
  role: string;
  status: string;
  actions: string;
  active: string;
  inactive: string;
  admin: string;
  user: string;
  delete: string;
  confirmDeleteTitle: string;
  confirmDeleteMessage: string;
  confirmDelete: string;
  cancelDelete: string;
  deleting: string;
  noUsers: string;
  view: string;
  back: string;
  detailTitle: string;
  addresses: string;
  noAddresses: string;
  orders: string;
  noOrders: string;
  subscriptions: string;
  noSubscriptions: string;
  orderDate: string;
  orderTotal: string;
  orderStatus: string;
  subStart: string;
  subEnd: string;
  subStatus: string;
  loading: string;
  viewOrder: string;
  mfa: string;
  mfaEnabled: string;
  mfaDisabled: string;
  resetMfa: string;
  resetMfaConfirm: string;
  resetMfaSuccess: string;
  resetMfaError: string;
  resetMfaTicketRequired: string;
}

const PAGE_SIZE = 10;

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  payee: "bg-blue-100 text-blue-800",
  en_cours: "bg-yellow-100 text-yellow-800",
  echoue: "bg-red-100 text-red-800",
  expire: "bg-gray-100 text-gray-800",
};

function SubscriptionStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status] || "bg-gray-100 text-gray-800"}`}
    >
      {status}
    </span>
  );
}

export default function UsersTableClient({
  users,
  translations: t,
  initialDetailId,
  initialMfaTicketId,
}: {
  users: User[];
  translations: Translations;
  initialDetailId?: string;
  initialMfaTicketId?: string;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isPending, startTransition] = useTransition();
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(Boolean(initialDetailId));
  const [mfaResetMessage, setMfaResetMessage] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const tPagination = useTranslations("admin.pagination");

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (!initialDetailId) {
        if (!cancelled) { setDetail(null); setIsLoadingDetail(false); }
        return;
      }
      if (!cancelled) setIsLoadingDetail(true);
      const data = await getUserDetail(initialDetailId);
      if (!cancelled) { setDetail(data); setIsLoadingDetail(false); }
    });
    return () => { cancelled = true; };
  }, [initialDetailId]);

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter((u) => u.adresse_mail.toLowerCase().includes(q));
  }, [users, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleToggleStatus = (user: User) => {
    startTransition(async () => {
      await toggleUserStatus(user.id_compte, !user.is_actif);
      router.refresh();
    });
  };

  const handleRoleChange = (user: User, newRole: string) => {
    startTransition(async () => {
      await updateUserRole(user.id_compte, newRole);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteUser(deleteTarget.id_compte);
      setDeleteTarget(null);
      router.refresh();
    });
  };

  const handleViewDetail = async (user: User) => {
    setIsLoadingDetail(true);
    router.push(`${pathname}?detail=${user.id_compte}`);
    const data = await getUserDetail(user.id_compte);
    setDetail(data);
    setIsLoadingDetail(false);
  };

  const handleMfaReset = () => {
    if (!detail || !initialMfaTicketId || !window.confirm(t.resetMfaConfirm)) return;
    startTransition(async () => {
      const result = await resetUserMfa(detail.id_compte, initialMfaTicketId);
      if (result.ok) {
        setDetail({ ...detail, mfa_enabled: false });
        setMfaResetMessage(t.resetMfaSuccess);
      } else {
        setMfaResetMessage(result.error === "ticket_required" ? t.resetMfaTicketRequired : t.resetMfaError);
      }
    });
  };

  // ─── Detail view ───
  if (detail) {
    return (
      <div>
        <AdminBackButton className="mb-4" label={t.back} />

        <h2 className="mb-6 text-xl font-bold">{t.detailTitle}</h2>

        <div className="mb-6 grid gap-3 rounded-lg border p-4 max-w-lg">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t.name}</span>
            <span className="text-sm font-medium">{detail.nom_complet}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t.email}</span>
            <span className="text-sm font-medium">{detail.adresse_mail}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t.role}</span>
            <span className="text-sm font-medium">
              {detail.role === "admin" ? t.admin : t.user}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t.status}</span>
            <span
              className={`text-sm font-medium ${detail.is_actif ? "text-green-600" : "text-red-500"}`}
            >
              {detail.is_actif ? t.active : t.inactive}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t.mfa}</span>
            <span className="text-sm font-medium">{detail.mfa_enabled ? t.mfaEnabled : t.mfaDisabled}</span>
          </div>
        </div>

        {detail.mfa_enabled && initialMfaTicketId && (
          <div className="mb-6 max-w-lg rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-900">{t.resetMfaConfirm}</p>
            <Button className="mt-3 gap-2" disabled={isPending} onClick={handleMfaReset} type="button" variant="destructive"><ShieldOff className="size-4" />{t.resetMfa}</Button>
            {mfaResetMessage && <p className="mt-3 text-sm font-medium text-amber-950" role="status">{mfaResetMessage}</p>}
          </div>
        )}

        {/* Addresses */}
        <h3 className="mb-3 text-lg font-semibold">{t.addresses}</h3>
        {detail.adresses.length === 0 ? (
          <p className="mb-6 text-sm text-muted-foreground">{t.noAddresses}</p>
        ) : (
          <div className="mb-6 grid gap-3 max-w-lg">
            {detail.adresses.map((a) => (
              <div key={a.id_adresse} className="rounded-lg border p-3 text-sm">
                <p>{a.adresse}</p>
                <p>
                  {a.code_postal} {a.ville}, {a.pays}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Orders */}
        <h3 className="mb-3 text-lg font-semibold">{t.orders}</h3>
        {detail.commandes.length === 0 ? (
          <p className="mb-6 text-sm text-muted-foreground">{t.noOrders}</p>
        ) : (
          <Table className="mb-6">
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t.orderDate}</TableHead>
                <TableHead>{t.orderTotal}</TableHead>
                <TableHead>{t.orderStatus}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.commandes.map((c, index) => (
                <TableRow
                  key={c.id_commande}
                  className={index % 2 === 1 ? "bg-muted/20" : ""}
                >
                  <TableCell className="font-mono text-xs">
                    {c.id_commande}
                  </TableCell>
                  <TableCell>
                    {new Date(c.date_commande).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>{c.montant_total.toFixed(2)} €</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={c.statut_commande} />
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/orders?detail=${c.id_commande}`}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="mr-1 h-3.5 w-3.5" />
                        {t.viewOrder}
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Subscriptions */}
        <h3 className="mb-3 text-lg font-semibold">{t.subscriptions}</h3>
        {detail.abonnements.length === 0 ? (
          <p className="mb-6 text-sm text-muted-foreground">
            {t.noSubscriptions}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t.subStart}</TableHead>
                <TableHead>{t.subEnd}</TableHead>
                <TableHead>{t.subStatus}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.abonnements.map((a, index) => (
                <TableRow
                  key={a.id_abonnement}
                  className={index % 2 === 1 ? "bg-muted/20" : ""}
                >
                  <TableCell className="font-mono text-xs">
                    {a.id_abonnement}
                  </TableCell>
                  <TableCell>
                    {new Date(a.date_debut).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    {a.date_fin
                      ? new Date(a.date_fin).toLocaleDateString("fr-FR")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <SubscriptionStatusBadge status={a.statut_abonnement} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    );
  }

  // ─── Loading detail ───
  if (isLoadingDetail) {
    return (
      <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
        <Spinner /> {t.loading}
      </div>
    );
  }

  // ─── Users table ───
  return (
    <>
      <input
        type="text"
        placeholder={t.search}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
        className="mb-4 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring sm:max-w-sm"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.name}</TableHead>
            <TableHead>{t.email}</TableHead>
            <TableHead>{t.role}</TableHead>
            <TableHead>{t.status}</TableHead>
            <TableHead>{t.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                {t.noUsers}
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((user, index) => (
              <TableRow
                key={user.id_compte}
                className={index % 2 === 1 ? "bg-muted/20" : ""}
              >
                <TableCell>{user.nom_complet}</TableCell>
                <TableCell>{user.adresse_mail}</TableCell>
                <TableCell>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user, e.target.value)}
                    disabled={isPending}
                    className="rounded-md border bg-background px-2 py-1 text-sm"
                  >
                    <option value="admin">{t.admin}</option>
                    <option value="client">{t.user}</option>
                  </select>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(user)}
                    disabled={isPending}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${user.is_actif ? "bg-primary" : "bg-muted"}`}
                  >
                    <span
                      className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${user.is_actif ? "translate-x-4" : "translate-x-0"}`}
                    />
                  </button>
                  <span className="ml-2 text-xs">
                    {user.is_actif ? t.active : t.inactive}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetail(user)}
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      {t.view}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTarget(user)}
                    >
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

      <Dialog.Root
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/20 supports-backdrop-filter:backdrop-blur-xs" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg sm:p-6">
            <Dialog.Title className="text-base font-semibold">
              {t.confirmDeleteTitle}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              {deleteTarget
                ? t.confirmDeleteMessage.replace(
                    "{name}",
                    deleteTarget.nom_complet,
                  )
                : ""}
            </Dialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close
                render={<Button variant="outline" size="sm" />}
              >
                {t.cancelDelete}
              </Dialog.Close>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
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
    </>
  );
}
