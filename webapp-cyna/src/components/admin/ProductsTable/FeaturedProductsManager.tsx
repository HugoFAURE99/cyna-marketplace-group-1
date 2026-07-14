"use client";

import { useState, useTransition, useCallback, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { useRouter } from "@/i18n/navigation";
import Fuse from "fuse.js";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import type { getProducts } from "@/app/[locale]/(admin)/admin/_actions/product.actions";
import { updateFeaturedProducts } from "@/app/[locale]/(admin)/admin/_actions/product.actions";
import type { CategoryOption } from "./ProductsPageTabs";

type Product = Awaited<ReturnType<typeof getProducts>>[number];

const MAX_FEATURED = 6;

interface Translations {
  title: string;
  validate: string;
  validating: string;
  dragHint: string;
  addProduct: string;
  removeProduct: string;
  emptySlot: string;
  pickerTitle: string;
  pickerSearch: string;
  pickerName: string;
  pickerCategory: string;
  pickerPrice: string;
  pickerNoResults: string;
  pickerSelect: string;
  allCategories: string;
  unsavedTitle: string;
  unsavedMessage: string;
  unsavedLeave: string;
  unsavedStay: string;
  confirmRemoveTitle: string;
  confirmRemoveMessage: string;
  confirmRemove: string;
  cancelRemove: string;
  cancel: string;
}

function SortableCard({
  product,
  onRemoveClick,
}: {
  product: Product;
  onRemoveClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id_produit });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const monthlyPrice = product.prix_tarif.find(
    (p) => p.type_facturation === "mensuel",
  );
  const annualPrice = product.prix_tarif.find(
    (p) => p.type_facturation === "annuel",
  );
  const displayPrice = monthlyPrice
    ? `€${(monthlyPrice.prix / 100).toFixed(0)}/mo`
    : annualPrice
      ? `€${(annualPrice.prix / 100).toFixed(0)}/yr`
      : "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex cursor-grab flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
      {...attributes}
      {...listeners}
    >
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRemoveClick();
        }}
        className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
      >
        ✕
      </button>
      <div className="flex aspect-[3/2] items-center justify-center bg-muted/30">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.nom_pro}
            className="h-full w-full object-cover"
            height={240}
            unoptimized
            width={360}
          />
        ) : (
          <svg
            className="h-12 w-12 text-muted-foreground/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium leading-tight">{product.nom_pro}</p>
        {displayPrice && (
          <p className="mt-1 text-xs text-primary font-semibold">
            {displayPrice}
          </p>
        )}
      </div>
    </div>
  );
}

function AddCard({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex aspect-[3/2] flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
    >
      <svg
        className="mb-2 h-8 w-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M12 4v16m8-8H4" />
      </svg>
      <span className="text-xs">{label}</span>
    </button>
  );
}

function ProductPickerModal({
  open,
  onOpenChange,
  products,
  selectedIds,
  categories,
  translations,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  selectedIds: Set<number>;
  categories: CategoryOption[];
  translations: Translations;
  onSelect: (product: Product) => void;
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const t = translations;

  const activeProducts = useMemo(
    () => products.filter((p) => p.statut_produit && !selectedIds.has(p.id_produit)),
    [products, selectedIds],
  );

  const categoryFiltered = useMemo(
    () =>
      categoryFilter
        ? activeProducts.filter((p) => p.id_categorie === categoryFilter)
        : activeProducts,
    [activeProducts, categoryFilter],
  );

  const fuse = useMemo(
    () => new Fuse(categoryFiltered, { keys: ["nom_pro"], threshold: 0.3 }),
    [categoryFiltered],
  );

  const results = search.trim()
    ? fuse.search(search).map((r) => r.item)
    : categoryFiltered;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/20 supports-backdrop-filter:backdrop-blur-xs" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-full max-w-2xl max-h-[80vh] -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-popover text-popover-foreground shadow-lg flex flex-col">
          <div className="p-6 pb-0">
            <Dialog.Title className="text-base font-semibold">
              {t.pickerTitle}
            </Dialog.Title>
            <div className="mt-4 flex gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.pickerSearch}
                className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <select
                value={categoryFilter ?? ""}
                onChange={(e) =>
                  setCategoryFilter(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className="rounded-md border bg-background px-3 py-1.5 text-sm"
              >
                <option value="">{t.allCategories}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 pt-4">
            {results.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t.pickerNoResults}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.pickerName}</TableHead>
                    <TableHead>{t.pickerCategory}</TableHead>
                    <TableHead>{t.pickerPrice}</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((product, index) => {
                    const monthly = product.prix_tarif.find(
                      (p) => p.type_facturation === "mensuel",
                    );
                    return (
                      <TableRow
                        key={product.id_produit}
                        className={`${index % 2 === 1 ? "bg-muted/20" : ""}`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {product.image ? (
                              <Image
                                src={product.image}
                                alt=""
                                className="h-8 w-8 rounded object-cover"
                                height={32}
                                unoptimized
                                width={32}
                              />
                            ) : (
                              <span className="flex h-8 w-8 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                            {product.nom_pro}
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.categorie?.cat_nom || "—"}
                        </TableCell>
                        <TableCell>
                          {monthly
                            ? `${(monthly.prix / 100).toFixed(2)} €`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              onSelect(product);
                              onOpenChange(false);
                            }}
                          >
                            {t.pickerSelect}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function FeaturedProductsManager({
  products,
  categories,
  translations,
  onDirtyChange,
  onRegisterSave,
}: {
  products: Product[];
  categories: CategoryOption[];
  translations: Translations;
  onDirtyChange?: (dirty: boolean) => void;
  onRegisterSave?: (fn: () => Promise<void>) => void;
}) {
  const featuredProducts = useMemo(
    () =>
      products
        .filter((p) => p.mis_avant)
        .sort((a, b) => (a.mis_avant_ordre ?? 0) - (b.mis_avant_ordre ?? 0)),
    [products],
  );

  const [items, setItems] = useState<Product[]>(featuredProducts);
  const [isDirty, setIsDirty] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Product | null>(null);
  const router = useRouter();
  const t = translations;

  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const { showUnsavedDialog, confirmNavigation, cancelNavigation } =
    useUnsavedChanges(isDirty);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Register save function once (stable ref)
  useEffect(() => {
    onRegisterSave?.(async () => {
      await updateFeaturedProducts(
        itemsRef.current.map((p, i) => ({ id: p.id_produit, ordre: i + 1 })),
      );
      setIsDirty(false);
    });
  }, [onRegisterSave]);

  // Sync from server when featured list changes
  const currentFeaturedIds = featuredProducts.map((p) => p.id_produit).join(",");
  const [prevIds, setPrevIds] = useState(currentFeaturedIds);
  if (currentFeaturedIds !== prevIds) {
    setItems(featuredProducts);
    setPrevIds(currentFeaturedIds);
    setIsDirty(false);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((p) => p.id_produit === active.id);
      const newIndex = prev.findIndex((p) => p.id_produit === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
    setIsDirty(true);
  }, []);

  const handleAddProduct = useCallback(
    (product: Product) => {
      if (items.length >= MAX_FEATURED) return;
      setItems((prev) => [...prev, product]);
      setIsDirty(true);
    },
    [items.length],
  );

  const handleConfirmRemove = useCallback(() => {
    if (!removeTarget) return;
    setItems((prev) => prev.filter((p) => p.id_produit !== removeTarget.id_produit));
    setIsDirty(true);
    setRemoveTarget(null);
  }, [removeTarget]);

  const handleCancel = useCallback(() => {
    setItems(featuredProducts);
    setIsDirty(false);
  }, [featuredProducts]);

  const handleValidate = () => {
    startTransition(async () => {
      await updateFeaturedProducts(
        items.map((p, i) => ({ id: p.id_produit, ordre: i + 1 })),
      );
      setIsDirty(false);
      router.refresh();
    });
  };

  const selectedIds = useMemo(
    () => new Set(items.map((p) => p.id_produit)),
    [items],
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t.title}</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{t.dragHint}</span>
          {isDirty && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isPending}
            >
              {t.cancel}
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleValidate}
            disabled={!isDirty || isPending}
            className={!isDirty ? "opacity-40" : ""}
          >
            {isPending ? <><Spinner /> {t.validating}</> : t.validate}
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((p) => p.id_produit)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-3 gap-4">
            {items.map((product) => (
              <SortableCard
                key={product.id_produit}
                product={product}
                onRemoveClick={() => setRemoveTarget(product)}
              />
            ))}
            {items.length < MAX_FEATURED && (
              <AddCard
                onClick={() => setPickerOpen(true)}
                label={t.addProduct}
              />
            )}
          </div>
        </SortableContext>
      </DndContext>

      <ProductPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        products={products}
        selectedIds={selectedIds}
        categories={categories}
        translations={t}
        onSelect={handleAddProduct}
      />

      {/* Remove confirmation modal */}
      <Dialog.Root
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/20 supports-backdrop-filter:backdrop-blur-xs" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-popover p-6 text-popover-foreground shadow-lg">
            <Dialog.Title className="text-base font-semibold">
              {t.confirmRemoveTitle}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              {removeTarget
                ? t.confirmRemoveMessage.replace("{name}", removeTarget.nom_pro)
                : ""}
            </Dialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setRemoveTarget(null)}>
                {t.cancelRemove}
              </Button>
              <Button variant="destructive" size="sm" onClick={handleConfirmRemove}>
                {t.confirmRemove}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Unsaved changes modal (for link navigation) */}
      <Dialog.Root
        open={showUnsavedDialog}
        onOpenChange={(open) => {
          if (!open) cancelNavigation();
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/20 supports-backdrop-filter:backdrop-blur-xs" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-popover p-6 text-popover-foreground shadow-lg">
            <Dialog.Title className="text-base font-semibold">
              {t.unsavedTitle}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              {t.unsavedMessage}
            </Dialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={cancelNavigation}>
                {t.unsavedStay}
              </Button>
              <Button variant="destructive" size="sm" onClick={confirmNavigation}>
                {t.unsavedLeave}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
