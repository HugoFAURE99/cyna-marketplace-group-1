"use client";

import { useState, useMemo, useTransition, useRef, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Pencil, Check, X } from "lucide-react";
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
import type { getProducts } from "@/app/[locale]/(admin)/admin/_actions/product.actions";
import {
  deleteProducts,
  bulkToggleProductStatus,
  bulkToggleProductPriority,
  updateProductStock,
} from "@/app/[locale]/(admin)/admin/_actions/product.actions";
import Spinner from "@/components/ui/spinner";
import DeleteProductButton from "@/components/admin/ProductsTable/DeleteProductButton";
import ToggleStatusButton from "@/components/admin/ProductsTable/ToggleStatusButton";
import TogglePriorityButton from "@/components/admin/ProductsTable/TogglePriorityButton";

type Product = Awaited<ReturnType<typeof getProducts>>[number];

type SortDirection = "asc" | "desc" | null;
type SortKey = "name" | "category" | "status" | "priority" | "stock" | "priceMonthly" | "priceAnnual";

interface Translations {
  image: string;
  name: string;
  category: string;
  status: string;
  priceMonthly: string;
  priceAnnual: string;
  actions: string;
  priority: string;
  stock: string;
  active: string;
  inactive: string;
  edit: string;
}

function SortableHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  return (
    <TableHead className="cursor-pointer select-none" onClick={onClick}>
      <div className="flex items-center gap-1">
        {label}
        <span className="text-xs">
          {active && direction === "asc"
            ? "▲"
            : active && direction === "desc"
              ? "▼"
              : "⇅"}
        </span>
      </div>
    </TableHead>
  );
}

function getMonthlyPrice(product: Product): number | null {
  const t = product.prix_tarif.find((p) => p.type_facturation === "mensuel");
  return t ? t.prix : null;
}

function getAnnualPrice(product: Product): number | null {
  const t = product.prix_tarif.find((p) => p.type_facturation === "annuel");
  return t ? t.prix : null;
}

function InlineStockEditor({ productId, quantity }: { productId: number; quantity: number }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(quantity));
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    setValue(String(quantity));
  }, [quantity]);

  const save = () => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) {
      setValue(String(quantity));
      setEditing(false);
      return;
    }
    if (num === quantity) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      await updateProductStock(productId, num);
      setEditing(false);
      router.refresh();
    });
  };

  const cancel = () => {
    setValue(String(quantity));
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
          disabled={isPending}
          className="w-16 rounded border bg-background px-1.5 py-0.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <Button type="button" variant="outline" size="sm" onClick={save} disabled={isPending} className="h-7 w-7 p-0 text-green-600">
          <Check className="h-4 w-4" strokeWidth={3} />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={cancel} disabled={isPending} className="h-7 w-7 p-0 text-red-500">
          <X className="h-4 w-4" strokeWidth={3} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-sm font-medium ${quantity <= 0 ? "text-red-600" : ""}`}>{quantity}</span>
      <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)} className="h-7 w-7 p-0">
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export default function ProductsTableClient({
  products,
  translations,
  pageSize,
}: {
  products: Product[];
  translations: Translations;
  pageSize?: number;
}) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const tBulk = useTranslations("admin.bulk");
  const tDelete = useTranslations("admin.delete");

  const handleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
      setSortDir(null);
    }
  };

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir)
      return [...products].sort((a, b) => a.id_produit - b.id_produit);

    return [...products].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.nom_pro.localeCompare(b.nom_pro);
          break;
        case "category":
          cmp = (a.categorie?.cat_nom || "").localeCompare(
            b.categorie?.cat_nom || "",
          );
          break;
        case "status":
          cmp = Number(a.statut_produit) - Number(b.statut_produit);
          break;
        case "priority":
          cmp = Number(a.is_priorite) - Number(b.is_priorite);
          break;
        case "stock":
          cmp = a.quantite_produit - b.quantite_produit;
          break;
        case "priceMonthly": {
          const pa = getMonthlyPrice(a) ?? -Infinity;
          const pb = getMonthlyPrice(b) ?? -Infinity;
          cmp = pa - pb;
          break;
        }
        case "priceAnnual": {
          const pa = getAnnualPrice(a) ?? -Infinity;
          const pb = getAnnualPrice(b) ?? -Infinity;
          cmp = pa - pb;
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [products, sortKey, sortDir]);

  const totalPages = pageSize ? Math.ceil(sorted.length / pageSize) : 1;
  const paginated = pageSize ? sorted.slice(page * pageSize, (page + 1) * pageSize) : sorted;

  const t = translations;
  const tPagination = useTranslations("admin.pagination");

  const allIds = products.map((p) => p.id_produit);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  };

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    setError(null);
    startTransition(async () => {
      try {
        await deleteProducts([...selected]);
        setSelected(new Set());
        setConfirmOpen(false);
        router.refresh();
      } catch {
        setError(tBulk("error"));
      }
    });
  };

  const handleBulkPriority = (priority: boolean) => {
    setError(null);
    startTransition(async () => {
      try {
        await bulkToggleProductPriority([...selected], priority);
        setSelected(new Set());
        router.refresh();
      } catch {
        setError(tBulk("error"));
      }
    });
  };

  const handleBulkToggle = (active: boolean) => {
    setError(null);
    startTransition(async () => {
      try {
        await bulkToggleProductStatus([...selected], active);
        setSelected(new Set());
        router.refresh();
      } catch {
        setError(tBulk("error"));
      }
    });
  };

  return (
    <>
      <div className={`mb-4 flex items-center gap-3 rounded-lg border px-4 py-2 transition-opacity ${selected.size > 0 ? "bg-muted/50" : "opacity-40 pointer-events-none bg-muted/30"}`}>
          <span className="text-sm font-medium">
            {tBulk("selected", { count: selected.size })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkToggle(true)}
            disabled={isPending || selected.size === 0}
          >
            {tBulk("activateSelected")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkToggle(false)}
            disabled={isPending || selected.size === 0}
          >
            {tBulk("deactivateSelected")}
          </Button>
          <span className="mx-1 h-5 w-px bg-border" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkPriority(true)}
            disabled={isPending || selected.size === 0}
          >
            {tBulk("priorityOn")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkPriority(false)}
            disabled={isPending || selected.size === 0}
          >
            {tBulk("priorityOff")}
          </Button>

          <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
            <Dialog.Trigger
              render={
                <Button variant="destructive" size="sm" disabled={isPending || selected.size === 0} />
              }
            >
              {tBulk("deleteSelected")}
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/20 supports-backdrop-filter:backdrop-blur-xs" />
              <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-popover p-6 text-popover-foreground shadow-lg">
                <Dialog.Title className="text-base font-semibold">
                  {tBulk("confirmTitle")}
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                  {tBulk("confirmProducts", { count: selected.size })}
                </Dialog.Description>
                {error && (
                  <p className="mt-3 text-sm text-destructive">{error}</p>
                )}
                <div className="mt-5 flex justify-end gap-2">
                  <Dialog.Close
                    render={<Button variant="outline" size="sm" />}
                  >
                    {tDelete("cancel")}
                  </Dialog.Close>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={isPending}
                  >
                    {isPending ? <><Spinner /> {tDelete("deleting")}</> : tDelete("confirm")}
                  </Button>
                </div>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>

          {error && !confirmOpen && (
            <span className="text-sm text-destructive">{error}</span>
          )}
        </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-gray-300"
              />
            </TableHead>
            <TableHead>{t.image}</TableHead>
            <SortableHeader
              label={t.name}
              active={sortKey === "name"}
              direction={sortDir}
              onClick={() => handleSort("name")}
            />
            <SortableHeader
              label={t.category}
              active={sortKey === "category"}
              direction={sortDir}
              onClick={() => handleSort("category")}
            />
            <SortableHeader
              label={t.status}
              active={sortKey === "status"}
              direction={sortDir}
              onClick={() => handleSort("status")}
            />
            <SortableHeader
              label={t.priority}
              active={sortKey === "priority"}
              direction={sortDir}
              onClick={() => handleSort("priority")}
            />
            <SortableHeader
              label={t.stock}
              active={sortKey === "stock"}
              direction={sortDir}
              onClick={() => handleSort("stock")}
            />
            <SortableHeader
              label={t.priceMonthly}
              active={sortKey === "priceMonthly"}
              direction={sortDir}
              onClick={() => handleSort("priceMonthly")}
            />
            <SortableHeader
              label={t.priceAnnual}
              active={sortKey === "priceAnnual"}
              direction={sortDir}
              onClick={() => handleSort("priceAnnual")}
            />
            <TableHead>{t.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.map((product, index) => (
            <TableRow
              key={product.id_produit}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${product.statut_produit && product.quantite_produit <= 0 ? "bg-red-50" : selected.has(product.id_produit) ? "bg-muted/40" : index % 2 === 1 ? "bg-muted/20" : ""}`}
              onClick={() => router.push(`/admin/products/${product.id_produit}/detail`)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selected.has(product.id_produit)}
                  onChange={() => toggleOne(product.id_produit)}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </TableCell>
              <TableCell>
                {product.image ? (
                  <img
                    src={product.image}
                    alt=""
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {product.nom_pro}
                  {product.mis_avant && (
                    <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                      featured
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>{product.categorie?.cat_nom || "—"}</TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                  <ToggleStatusButton
                    productId={product.id_produit}
                    active={product.statut_produit}
                  />
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      product.statut_produit
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {product.statut_produit ? t.active : t.inactive}
                  </span>
                </div>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <TogglePriorityButton
                  productId={product.id_produit}
                  priority={product.is_priorite}
                />
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <InlineStockEditor
                  productId={product.id_produit}
                  quantity={product.quantite_produit}
                />
              </TableCell>
              <TableCell>
                {product.prix_tarif.find(
                  (p) => p.type_facturation === "mensuel",
                )
                  ? `${(product.prix_tarif.find((p) => p.type_facturation === "mensuel")!.prix / 100).toFixed(2)} €`
                  : "—"}
              </TableCell>
              <TableCell>
                {product.prix_tarif.find(
                  (p) => p.type_facturation === "annuel",
                )
                  ? `${(product.prix_tarif.find((p) => p.type_facturation === "annuel")!.prix / 100).toFixed(2)} €`
                  : "—"}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/products/${product.id_produit}`} />}>
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    {t.edit}
                  </Button>
                  <DeleteProductButton
                    productId={product.id_produit}
                    productName={product.nom_pro}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {pageSize && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {tPagination("info", {
              from: page * pageSize + 1,
              to: Math.min((page + 1) * pageSize, sorted.length),
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
