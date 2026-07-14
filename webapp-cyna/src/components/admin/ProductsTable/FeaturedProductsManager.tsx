"use client";

import { useState, useTransition, useCallback, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { ImageOff, X } from "lucide-react";
import Fuse from "fuse.js";
import {
  DndContext,
  DragOverlay,
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
import PromotionalPrice from "@/components/product/PromotionalPrice";
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
import type { Locale } from "@/lib/i18n/translations";

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
  close: string;
  dragProduct: string;
  perMonth: string;
  perYear: string;
  promotionBadge: string;
}

function FeaturedProductCard({
  product,
  locale,
  translations,
  onRemoveClick,
  overlay = false,
}: {
  product: Product;
  locale: Locale;
  translations: Translations;
  onRemoveClick?: () => void;
  overlay?: boolean;
}) {
  const monthlyPrice = product.prix_tarif.find(
    (p) => p.type_facturation === "mensuel",
  );
  const annualPrice = product.prix_tarif.find(
    (p) => p.type_facturation === "annuel",
  );
  const displayTariff = monthlyPrice ?? annualPrice;

  return (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-lg border bg-white transition-[border-color,box-shadow] ${
        overlay
          ? "border-purple-400 shadow-xl ring-2 ring-purple-500/20"
          : "border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md"
      }`}
    >
      {onRemoveClick && (
        <div className="absolute right-2 top-2 z-10">
          <button
            aria-label={translations.removeProduct}
            className="flex size-8 items-center justify-center rounded-full bg-slate-950/80 text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            onClick={onRemoveClick}
            onKeyDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      )}
      <div className="flex aspect-[16/9] items-center justify-center overflow-hidden bg-slate-100">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.nom_pro}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            height={240}
            unoptimized
            width={360}
          />
        ) : (
          <ImageOff aria-hidden="true" className="size-8 text-slate-500" />
        )}
      </div>
      <div className="space-y-1 p-4">
        {product.categorie?.cat_nom && (
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">
            {product.categorie.cat_nom}
          </p>
        )}
        <p className="text-base font-semibold leading-tight text-slate-950">{product.nom_pro}</p>
        {displayTariff && (
          <PromotionalPrice
            automaticPromotion={displayTariff.automaticPromotion}
            badgeLabel={(discount) =>
              translations.promotionBadge.replace("{discount}", discount)
            }
            className="text-sm"
            locale={locale}
            originalPriceCents={displayTariff.prix}
            periodSuffix={
              displayTariff.type_facturation === "mensuel"
                ? translations.perMonth
                : translations.perYear
            }
            promotionalPriceCents={displayTariff.promotionalPriceCents}
          />
        )}
      </div>
    </div>
  );
}

function SortableCard({
  product,
  locale,
  translations,
  onRemoveClick,
}: {
  product: Product;
  locale: Locale;
  translations: Translations;
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

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? undefined : transition,
        opacity: isDragging ? 0 : 1,
      }}
      className="cursor-grab touch-none select-none rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <FeaturedProductCard
        locale={locale}
        onRemoveClick={onRemoveClick}
        product={product}
        translations={translations}
      />
    </div>
  );
}

function AddCard({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-52 flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
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
  locale,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  selectedIds: Set<number>;
  categories: CategoryOption[];
  translations: Translations;
  onSelect: (product: Product) => void;
  locale: Locale;
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
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex h-[85dvh] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg">
          <div className="shrink-0 border-b bg-popover p-4 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <Dialog.Title className="text-base font-semibold">
                {t.pickerTitle}
              </Dialog.Title>
              <Dialog.Close
                aria-label={t.close}
                className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X aria-hidden="true" className="size-5" />
              </Dialog.Close>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.pickerSearch}
                className="min-h-11 flex-1 rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <select
                value={categoryFilter ?? ""}
                onChange={(e) =>
                  setCategoryFilter(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className="min-h-11 rounded-md border bg-background px-3 py-1.5 text-sm sm:min-w-56"
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
          <div className="min-h-0 flex-1 overscroll-contain overflow-auto p-4 sm:p-6">
            {results.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t.pickerNoResults}
              </p>
            ) : (
              <Table className="min-w-[720px]">
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
                          {monthly ? (
                            <PromotionalPrice
                              automaticPromotion={monthly.automaticPromotion}
                              badgeLabel={(discount) =>
                                t.promotionBadge.replace("{discount}", discount)
                              }
                              className="text-sm"
                              locale={locale}
                              originalPriceCents={monthly.prix}
                              promotionalPriceCents={
                                monthly.promotionalPriceCents
                              }
                            />
                          ) : (
                            "—"
                          )}
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
          <div className="flex shrink-0 justify-end border-t bg-popover p-4">
            <Dialog.Close render={<Button variant="outline" size="sm" />}>
              {t.close}
            </Dialog.Close>
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
  const [activeProductId, setActiveProductId] = useState<number | null>(null);
  const router = useRouter();
  const locale = useLocale() as Locale;
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
    setActiveProductId(null);
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
  const activeProduct = useMemo(
    () => items.find((product) => product.id_produit === activeProductId) ?? null,
    [activeProductId, items],
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
        onDragCancel={() => setActiveProductId(null)}
        onDragEnd={handleDragEnd}
        onDragStart={({ active }) => setActiveProductId(Number(active.id))}
      >
        <SortableContext
          items={items.map((p) => p.id_produit)}
          strategy={rectSortingStrategy}
        >
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((product) => (
              <SortableCard
                key={product.id_produit}
                locale={locale}
                product={product}
                translations={t}
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
        <DragOverlay adjustScale={false} dropAnimation={null}>
          {activeProduct ? (
            <div className="pointer-events-none cursor-grabbing">
              <FeaturedProductCard
                locale={locale}
                overlay
                product={activeProduct}
                translations={t}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <ProductPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        products={products}
        selectedIds={selectedIds}
        categories={categories}
        translations={t}
        onSelect={handleAddProduct}
        locale={locale}
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
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg sm:p-6">
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
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg sm:p-6">
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
