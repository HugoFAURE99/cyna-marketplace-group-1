"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Eye, ArrowUpDown, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import AdminBackButton from "@/components/admin/AdminBackButton";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import {
  getOrderStatusFilterEntries,
  normalizeOrderStatus,
  orderStatusFilterValue,
} from "@/lib/orders/status";
import {
  getOrderDetail,
  type OrderRow,
  type OrderDetail,
} from "@/app/[locale]/(admin)/admin/_actions/order.actions";

interface Translations {
  title: string;
  search: string;
  allStatuses: string;
  statusEnAttente: string;
  statusValidee: string;
  statusEnCours: string;
  statusPayee: string;
  statusActive: string;
  statusEchoue: string;
  statusExpire: string;
  orderId: string;
  date: string;
  client: string;
  total: string;
  status: string;
  actions: string;
  noOrders: string;
  view: string;
  back: string;
  detailTitle: string;
  lineItems: string;
  product: string;
  quantity: string;
  unitPrice: string;
  subtotal: string;
  billingType: string;
  promotion: string;
  promoType: string;
  promoValue: string;
  noPromo: string;
  loading: string;
  dateFrom: string;
  dateTo: string;
  billingMensuel: string;
  billingAnnuel: string;
  invoice: string;
}

const PAGE_SIZE = 10;

type SortKey = "id_commande" | "date_commande" | "montant_total" | "statut_commande";
type SortDir = "asc" | "desc";

function translateBilling(raw: string, t: Translations): string {
  const s = raw.toLowerCase();
  if (s === "mensuel" || s === "monthly") return t.billingMensuel;
  if (s === "annuel" || s === "annual" || s === "yearly") return t.billingAnnuel;
  return raw;
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

function SortHeader({ active, label, onSort, sortField }: { active: boolean; label: string; onSort: (field: SortKey) => void; sortField: SortKey }) {
  return <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => onSort(sortField)} type="button">{label}<ArrowUpDown className={`h-3.5 w-3.5 ${active ? "text-foreground" : "text-muted-foreground/50"}`} /></button>;
}

export default function OrdersTableClient({
  orders,
  translations: t,
  initialDetailId,
}: {
  orders: OrderRow[];
  translations: Translations;
  initialDetailId?: string;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("date_commande");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(Boolean(initialDetailId));
  const router = useRouter();
  const pathname = usePathname();
  const tPagination = useTranslations("admin.pagination");
  const tStatus = useTranslations("orderStatus");

  useEffect(() => {
    let cancelled = false;
    const id = Number(initialDetailId);
    Promise.resolve().then(async () => {
      if (!initialDetailId || Number.isNaN(id)) {
        if (!cancelled) { setDetail(null); setIsLoadingDetail(false); }
        return;
      }
      if (!cancelled) setIsLoadingDetail(true);
      const data = await getOrderDetail(id);
      if (!cancelled) { setDetail(data); setIsLoadingDetail(false); }
    });
    return () => { cancelled = true; };
  }, [initialDetailId]);

  const statusEntries = useMemo(
    () => getOrderStatusFilterEntries(orders.map((order) => order.statut_commande)),
    [orders],
  );

  const filtered = useMemo(() => {
    let result = orders;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.client_email.toLowerCase().includes(q) ||
          String(o.id_commande).includes(q),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(
        (order) => orderStatusFilterValue(order.statut_commande) === statusFilter,
      );
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter((o) => new Date(o.date_commande) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((o) => new Date(o.date_commande) <= to);
    }

    return result;
  }, [orders, search, statusFilter, dateFrom, dateTo]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date_commande") {
        cmp = new Date(a.date_commande).getTime() - new Date(b.date_commande).getTime();
      } else if (sortKey === "montant_total") {
        cmp = a.montant_total - b.montant_total;
      } else if (sortKey === "id_commande") {
        cmp = a.id_commande - b.id_commande;
      } else if (sortKey === "statut_commande") {
        cmp = normalizeOrderStatus(a.statut_commande).localeCompare(
          normalizeOrderStatus(b.statut_commande),
        );
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  };

  const handleViewDetail = async (order: OrderRow) => {
    setIsLoadingDetail(true);
    router.push(`${pathname}?detail=${order.id_commande}`);
    const data = await getOrderDetail(order.id_commande);
    setDetail(data);
    setIsLoadingDetail(false);
  };

  // ─── Detail view ───
  if (detail) {
    return (
      <div>
        <AdminBackButton className="mb-4" label={t.back} />

        <h2 className="mb-6 text-xl font-bold">
          {t.detailTitle} #{detail.id_commande}
        </h2>

        <div className="mb-6 grid gap-3 rounded-lg border p-4 max-w-lg">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t.date}</span>
            <span className="text-sm font-medium">
              {new Date(detail.date_commande).toLocaleString("fr-FR")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t.client}</span>
            <span className="text-sm font-medium">
              {detail.client_name
                ? `${detail.client_name} (${detail.client_email})`
                : detail.client_email}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t.total}</span>
            <span className="text-sm font-medium">
              {detail.montant_total.toFixed(2)} €
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t.status}</span>
            <OrderStatusBadge status={detail.statut_commande} />
          </div>
          {detail.invoice_url && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<a href={detail.invoice_url} target="_blank" rel="noopener noreferrer" />}
              >
                <FileText className="mr-1 h-4 w-4" />
                {t.invoice}
              </Button>
            </div>
          )}
        </div>

        {/* Line items */}
        <h3 className="mb-3 text-lg font-semibold">{t.lineItems}</h3>
        <Table className="mb-6">
          <TableHeader>
            <TableRow>
              <TableHead>{t.product}</TableHead>
              <TableHead>{t.billingType}</TableHead>
              <TableHead className="text-right">{t.unitPrice}</TableHead>
              <TableHead className="text-right">{t.quantity}</TableHead>
              <TableHead className="text-right">{t.subtotal}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detail.lignes.map((l, i) => (
              <TableRow key={i} className={i % 2 === 1 ? "bg-muted/20" : ""}>
                <TableCell className="font-medium">{l.produit_nom}</TableCell>
                <TableCell>
                  <BillingBadge type={l.type_facturation} translations={t} />
                </TableCell>
                <TableCell className="text-right">
                  {l.prix_unitaire.toFixed(2)} €
                </TableCell>
                <TableCell className="text-right">{l.quantite}</TableCell>
                <TableCell className="text-right font-medium">
                  {l.sous_total.toFixed(2)} €
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Promotion */}
        <h3 className="mb-3 text-lg font-semibold">{t.promotion}</h3>
        {detail.promotion ? (
          <div className="rounded-lg border p-4 max-w-lg">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                {t.promoType}
              </span>
              <span className="text-sm font-medium">
                {detail.promotion.type_remise}
              </span>
            </div>
            <div className="mt-2 flex justify-between">
              <span className="text-sm text-muted-foreground">
                {t.promoValue}
              </span>
              <span className="text-sm font-medium">
                {detail.promotion.valeur_remise}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t.noPromo}</p>
        )}
      </div>
    );
  }

  // ─── Loading ───
  if (isLoadingDetail) {
    return (
      <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
        <Spinner /> {t.loading}
      </div>
    );
  }

  // ─── Orders table ───
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
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring sm:max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:w-auto"
        >
          <option value="all">{t.allStatuses}</option>
          {statusEntries.map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.key === "unknown" ? entry.raw : tStatus(entry.key)}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-muted-foreground">{t.dateFrom}</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(0);
            }}
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-muted-foreground">{t.dateTo}</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(0);
            }}
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortHeader active={sortKey === "id_commande"} label={t.orderId} onSort={toggleSort} sortField="id_commande" />
            </TableHead>
            <TableHead>
              <SortHeader active={sortKey === "date_commande"} label={t.date} onSort={toggleSort} sortField="date_commande" />
            </TableHead>
            <TableHead>{t.client}</TableHead>
            <TableHead>
              <SortHeader active={sortKey === "montant_total"} label={t.total} onSort={toggleSort} sortField="montant_total" />
            </TableHead>
            <TableHead>{t.billingType}</TableHead>
            <TableHead>
              <SortHeader active={sortKey === "statut_commande"} label={t.status} onSort={toggleSort} sortField="statut_commande" />
            </TableHead>
            <TableHead>{t.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground"
              >
                {t.noOrders}
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((order, index) => (
              <TableRow
                key={order.id_commande}
                className={index % 2 === 1 ? "bg-muted/20" : ""}
              >
                <TableCell className="font-mono text-xs">
                  #{order.id_commande}
                </TableCell>
                <TableCell>
                  {new Date(order.date_commande).toLocaleDateString("fr-FR")}
                </TableCell>
                <TableCell>
                  <div>
                    {order.client_name && (
                      <span className="block text-sm font-medium">
                        {order.client_name}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {order.client_email}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {order.montant_total.toFixed(2)} €
                </TableCell>
                <TableCell>
                  {order.type_facturation ? (
                    <BillingBadge type={order.type_facturation} translations={t} />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.statut_commande} />
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetail(order)}
                  >
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    {t.view}
                  </Button>
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
              to: Math.min((page + 1) * PAGE_SIZE, sorted.length),
              total: sorted.length,
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
    </>
  );
}
