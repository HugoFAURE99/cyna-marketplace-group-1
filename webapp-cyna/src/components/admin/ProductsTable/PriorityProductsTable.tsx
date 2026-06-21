"use client";

import { useState, useTransition, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "@/i18n/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import type { getProducts } from "@/app/[locale]/(admin)/admin/_actions/product.actions";
import { updatePriorityOrder } from "@/app/[locale]/(admin)/admin/_actions/product.actions";

type Product = Awaited<ReturnType<typeof getProducts>>[number];

interface Translations {
  title: string;
  image: string;
  name: string;
  category: string;
  order: string;
  validate: string;
  validating: string;
  noProducts: string;
  dragHint: string;
  unsavedTitle: string;
  unsavedMessage: string;
  unsavedLeave: string;
  unsavedStay: string;
  cancel: string;
}

function SortableRow({
  product,
  index,
  onClick,
}: {
  product: Product;
  index: number;
  onClick: () => void;
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

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer transition-colors hover:bg-muted/50 ${index % 2 === 1 ? "bg-muted/20" : ""}`}
      onClick={onClick}
    >
      <TableCell onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="cursor-grab touch-none px-1 text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
      </TableCell>
      <TableCell className="font-medium">{index + 1}</TableCell>
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
      <TableCell>{product.nom_pro}</TableCell>
      <TableCell>{product.categorie?.cat_nom || "—"}</TableCell>
    </TableRow>
  );
}

export default function PriorityProductsTable({
  products,
  translations,
  onDirtyChange,
  onRegisterSave,
}: {
  products: Product[];
  translations: Translations;
  onDirtyChange?: (dirty: boolean) => void;
  onRegisterSave?: (fn: () => Promise<void>) => void;
}) {
  const priorityProducts = useMemo(
    () =>
      products
        .filter((p) => p.is_priorite)
        .sort((a, b) => (a.ordre_priorite ?? 0) - (b.ordre_priorite ?? 0)),
    [products],
  );

  const [items, setItems] = useState(priorityProducts);
  const [isDirty, setIsDirty] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = translations;
  const { showUnsavedDialog, confirmNavigation, cancelNavigation, guardNavigation } =
    useUnsavedChanges(isDirty);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Register save function once (stable ref)
  useEffect(() => {
    onRegisterSave?.(async () => {
      await updatePriorityOrder(
        itemsRef.current.map((p, i) => ({ id: p.id_produit, ordre: i + 1 })),
      );
      setIsDirty(false);
    });
  }, [onRegisterSave]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Reset items when products change from server
  const currentPriorityIds = priorityProducts.map((p) => p.id_produit).join(",");
  const [prevIds, setPrevIds] = useState(currentPriorityIds);
  if (currentPriorityIds !== prevIds) {
    setItems(priorityProducts);
    setPrevIds(currentPriorityIds);
    setIsDirty(false);
  }

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setItems((prev) => {
        const oldIndex = prev.findIndex((p) => p.id_produit === active.id);
        const newIndex = prev.findIndex((p) => p.id_produit === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
      setIsDirty(true);
    },
    [],
  );

  const handleValidate = () => {
    startTransition(async () => {
      await updatePriorityOrder(
        items.map((p, i) => ({ id: p.id_produit, ordre: i + 1 })),
      );
      setIsDirty(false);
      router.refresh();
    });
  };

  const handleCancel = useCallback(() => {
    setItems(priorityProducts);
    setIsDirty(false);
  }, [priorityProducts]);

  if (priorityProducts.length === 0 && items.length === 0) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-semibold">{t.title}</h2>
        <p className="text-sm text-muted-foreground">{t.noProducts}</p>
      </div>
    );
  }

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
          strategy={verticalListSortingStrategy}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead className="w-12">#</TableHead>
                <TableHead className="w-16">{t.image}</TableHead>
                <TableHead>{t.name}</TableHead>
                <TableHead>{t.category}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((product, index) => (
                <SortableRow
                  key={product.id_produit}
                  product={product}
                  index={index}
                  onClick={() => {
                    const href = `/admin/products/${product.id_produit}/detail`;
                    guardNavigation(href, () => router.push(href));
                  }}
                />
              ))}
            </TableBody>
          </Table>
        </SortableContext>
      </DndContext>

      <Dialog.Root open={showUnsavedDialog} onOpenChange={(open) => { if (!open) cancelNavigation(); }}>
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
