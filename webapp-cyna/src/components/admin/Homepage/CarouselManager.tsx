"use client";

import Image from "next/image";

import { useState, useTransition, useCallback, useRef, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { Plus, X } from "lucide-react";
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
  verticalListSortingStrategy,
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
import ManagedLinkPicker, {
  type ManagedLinkPickerTranslations,
} from "@/components/admin/Homepage/ManagedLinkPicker";
import type { CarouselSlide } from "@/app/[locale]/(admin)/admin/_actions/homepage.actions";
import {
  createCarouselSlide,
  updateCarouselSlide,
  deleteCarouselSlide,
  toggleCarouselSlide,
  updateCarouselOrder,
} from "@/app/[locale]/(admin)/admin/_actions/homepage.actions";
import { parseManagedLink, type ManagedLinkOption } from "@/lib/navigation/managed-link";

interface Translations {
  title: string;
  addSlide: string;
  noSlides: string;
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
  image: string;
  active: string;
  inactive: string;
  save: string;
  saving: string;
  cancel: string;
  delete: string;
  deleting: string;
  confirmDeleteTitle: string;
  confirmDeleteMessage: string;
  confirmDelete: string;
  cancelDelete: string;
  dragOrClick: string;
  imageHint: string;
  editSlide: string;
  newSlide: string;
  addTranslation: string;
  defaultLang: string;
  order: string;
  validate: string;
  validating: string;
  dragHint: string;
  cancelOrder: string;
  unsavedTitle: string;
  unsavedMessage: string;
  unsavedLeave: string;
  unsavedStay: string;
  buttonText: string;
  buttonLink: string;
}

type EditingSlide = {
  id: number | null;
  titre_fr: string;
  description_fr: string;
  titre_en: string;
  description_en: string;
  hasEnTitle: boolean;
  hasEnDescription: boolean;
  imageFile: File | null;
  imagePreview: string | null;
  lien_bouton: string;
  texte_bouton_fr: string;
  texte_bouton_en: string;
  hasEnButton: boolean;
};

// ─── Sortable row ───

function SortableSlideRow({
  slide,
  index,
  translations,
  onEdit,
  onDelete,
  onToggle,
}: {
  slide: CarouselSlide;
  index: number;
  translations: Translations;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id_image });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const t = translations;

  return (
    <TableRow ref={setNodeRef} style={style} className={index % 2 === 1 ? "bg-muted/20" : ""}>
      <TableCell>
        <button
          type="button"
          className="cursor-grab touch-none px-1 text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
      </TableCell>
      <TableCell>
        <Image src={slide.lien_image_caroussel} alt="" className="h-14 w-24 rounded object-cover" height={56} unoptimized width={96} />
      </TableCell>
      <TableCell className="max-w-48 truncate text-sm">{slide.titre_fr || "—"}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              slide.est_actif ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform ${
                slide.est_actif ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
          <span className={`text-xs font-medium ${slide.est_actif ? "text-green-700" : "text-gray-500"}`}>
            {slide.est_actif ? t.active : t.inactive}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>{t.editSlide}</Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>{t.delete}</Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ─── Main component ───

export default function CarouselManager({
  slides,
  linkOptions,
  linkPickerTranslations,
  translations,
  onDirtyChange,
  onRegisterSave,
}: {
  slides: CarouselSlide[];
  linkOptions: ManagedLinkOption[];
  linkPickerTranslations: ManagedLinkPickerTranslations & { invalid: string };
  translations: Translations;
  onDirtyChange?: (dirty: boolean) => void;
  onRegisterSave?: (fn: () => Promise<void>) => void;
}) {
  const [editing, setEditing] = useState<EditingSlide | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CarouselSlide | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const t = translations;

  // ─── Drag-and-drop + toggle state ───
  const [orderedSlides, setOrderedSlides] = useState(slides);
  const [isDirty, setIsDirty] = useState(false);
  const [isOrderSaving, startOrderTransition] = useTransition();

  const orderedSlidesRef = useRef(orderedSlides);
  useEffect(() => {
    orderedSlidesRef.current = orderedSlides;
  }, [orderedSlides]);

  const { showUnsavedDialog, confirmNavigation, cancelNavigation } =
    useUnsavedChanges(isDirty);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    onRegisterSave?.(async () => {
      // Save order + toggle states
      const current = orderedSlidesRef.current;
      await updateCarouselOrder(
        current.map((s, i) => ({ id: s.id_image, ordre: i + 1 })),
      );
      // Save toggle changes
      for (const slide of current) {
        const original = slides.find((s) => s.id_image === slide.id_image);
        if (original && original.est_actif !== slide.est_actif) {
          await toggleCarouselSlide(slide.id_image, slide.est_actif);
        }
      }
      setIsDirty(false);
    });
  }, [onRegisterSave, slides]);

  // Sync from server
  const serverKey = slides.map((s) => `${s.id_image}:${s.est_actif}`).join(",");
  const [prevServerKey, setPrevServerKey] = useState(serverKey);
  if (serverKey !== prevServerKey) {
    setOrderedSlides(slides);
    setPrevServerKey(serverKey);
    setIsDirty(false);
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrderedSlides((prev) => {
      const oldIndex = prev.findIndex((s) => s.id_image === active.id);
      const newIndex = prev.findIndex((s) => s.id_image === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
    setIsDirty(true);
  }, []);

  const handleToggle = useCallback((id: number) => {
    setOrderedSlides((prev) =>
      prev.map((s) => s.id_image === id ? { ...s, est_actif: !s.est_actif } : s),
    );
    setIsDirty(true);
  }, []);

  const handleValidate = () => {
    startOrderTransition(async () => {
      const current = orderedSlidesRef.current;
      await updateCarouselOrder(
        current.map((s, i) => ({ id: s.id_image, ordre: i + 1 })),
      );
      for (const slide of current) {
        const original = slides.find((s) => s.id_image === slide.id_image);
        if (original && original.est_actif !== slide.est_actif) {
          await toggleCarouselSlide(slide.id_image, slide.est_actif);
        }
      }
      setIsDirty(false);
      router.refresh();
    });
  };

  const handleCancel = () => {
    setOrderedSlides(slides);
    setIsDirty(false);
  };

  // ─── Form handlers ───

  const startNew = () => {
    setLinkError(null);
    setEditing({
      id: null, titre_fr: "", description_fr: "", titre_en: "", description_en: "",
      hasEnTitle: false, hasEnDescription: false, imageFile: null, imagePreview: null,
      lien_bouton: "", texte_bouton_fr: "", texte_bouton_en: "", hasEnButton: false,
    });
  };

  const startEdit = (slide: CarouselSlide) => {
    setLinkError(null);
    setEditing({
      id: slide.id_image, titre_fr: slide.titre_fr,
      description_fr: slide.description_fr ?? "", titre_en: slide.titre_en,
      description_en: slide.description_en ?? "", hasEnTitle: !!slide.titre_en, hasEnDescription: !!slide.description_en,
      imageFile: null, imagePreview: slide.lien_image_caroussel,
      lien_bouton: slide.lien_bouton ?? "", texte_bouton_fr: slide.texte_bouton_fr ?? "",
      texte_bouton_en: slide.texte_bouton_en ?? "", hasEnButton: !!slide.texte_bouton_en,
    });
  };

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditing((prev) => {
      if (!prev) return prev;
      return { ...prev, imageFile: file, imagePreview: URL.createObjectURL(file) };
    });
  }, []);

  const handleSave = () => {
    if (!editing) return;
    if (editing.lien_bouton.trim() && !parseManagedLink(editing.lien_bouton)) {
      setLinkError(linkPickerTranslations.invalid);
      return;
    }
    setLinkError(null);
    startTransition(async () => {
      const formData = new FormData();
      if (editing.imageFile) formData.set("image", editing.imageFile);
      formData.set("titre_fr", editing.titre_fr);
      formData.set("description_fr", editing.description_fr);
      formData.set("titre_en", editing.hasEnTitle ? editing.titre_en : "");
      formData.set("description_en", editing.hasEnDescription ? editing.description_en : "");
      formData.set("has_en", String(editing.hasEnTitle || editing.hasEnDescription || editing.hasEnButton));
      formData.set("lien_bouton", editing.lien_bouton);
      formData.set("texte_bouton_fr", editing.texte_bouton_fr);
      formData.set("texte_bouton_en", editing.hasEnButton ? editing.texte_bouton_en : "");

      const result = editing.id === null
        ? await createCarouselSlide(formData)
        : await updateCarouselSlide(editing.id, formData);
      if (!result.ok) {
        setLinkError(linkPickerTranslations.invalid);
        return;
      }
      setEditing(null);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startDeleteTransition(async () => {
      await deleteCarouselSlide(deleteTarget.id_image);
      setDeleteTarget(null);
      router.refresh();
    });
  };

  // ─── Editing form ───
  if (editing) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-semibold">
          {editing.id === null ? t.newSlide : t.editSlide}
        </h2>
        <div className="grid gap-6 max-w-2xl">
          <div>
            <label className="mb-1.5 block text-sm font-medium">{t.image}</label>
            <div
              className="relative flex h-48 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/10 transition-colors hover:border-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              {editing.imagePreview ? (
                <Image src={editing.imagePreview} alt="" className="h-full w-full rounded-lg object-cover" height={192} unoptimized width={512} />
              ) : (
                <div className="text-center text-muted-foreground">
                  <p className="text-sm">{t.dragOrClick}</p>
                  <p className="mt-1 text-xs">{t.imageHint}</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
            </div>
          </div>

          <fieldset className="space-y-3 rounded-lg border p-4">
            <legend className="px-2 text-sm font-semibold">{t.titleFr.replace(" (FR)", "")}</legend>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">{t.defaultLang}</label>
              <input type="text" value={editing.titre_fr} onChange={(e) => setEditing((prev) => prev ? { ...prev, titre_fr: e.target.value } : prev)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            {editing.hasEnTitle && (
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">EN</label>
                  <button type="button" onClick={() => setEditing((prev) => prev ? { ...prev, hasEnTitle: false, titre_en: "" } : prev)} className="rounded p-0.5 text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                </div>
                <input type="text" value={editing.titre_en} onChange={(e) => setEditing((prev) => prev ? { ...prev, titre_en: e.target.value } : prev)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
            )}
            {!editing.hasEnTitle && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing((prev) => prev ? { ...prev, hasEnTitle: true } : prev)} className="gap-1">
                <Plus className="h-4 w-4" />{t.addTranslation}
              </Button>
            )}
          </fieldset>

          <fieldset className="space-y-3 rounded-lg border p-4">
            <legend className="px-2 text-sm font-semibold">{t.descriptionFr.replace(" (FR)", "")}</legend>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">{t.defaultLang}</label>
              <textarea value={editing.description_fr} onChange={(e) => setEditing((prev) => prev ? { ...prev, description_fr: e.target.value } : prev)} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            {editing.hasEnDescription && (
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">EN</label>
                  <button type="button" onClick={() => setEditing((prev) => prev ? { ...prev, hasEnDescription: false, description_en: "" } : prev)} className="rounded p-0.5 text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                </div>
                <textarea value={editing.description_en} onChange={(e) => setEditing((prev) => prev ? { ...prev, description_en: e.target.value } : prev)} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
            )}
            {!editing.hasEnDescription && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing((prev) => prev ? { ...prev, hasEnDescription: true } : prev)} className="gap-1">
                <Plus className="h-4 w-4" />{t.addTranslation}
              </Button>
            )}
          </fieldset>

          <fieldset className="space-y-3 rounded-lg border p-4">
            <legend className="px-2 text-sm font-semibold">{t.buttonText}</legend>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">{t.defaultLang}</label>
              <input type="text" value={editing.texte_bouton_fr} onChange={(e) => setEditing((prev) => prev ? { ...prev, texte_bouton_fr: e.target.value } : prev)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            {editing.hasEnButton && (
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">EN</label>
                  <button type="button" onClick={() => setEditing((prev) => prev ? { ...prev, hasEnButton: false, texte_bouton_en: "" } : prev)} className="rounded p-0.5 text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                </div>
                <input type="text" value={editing.texte_bouton_en} onChange={(e) => setEditing((prev) => prev ? { ...prev, texte_bouton_en: e.target.value } : prev)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
            )}
            {!editing.hasEnButton && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing((prev) => prev ? { ...prev, hasEnButton: true } : prev)} className="gap-1">
                <Plus className="h-4 w-4" />{t.addTranslation}
              </Button>
            )}
          </fieldset>

          <fieldset className="space-y-3 rounded-lg border p-4">
            <legend className="px-2 text-sm font-semibold">{t.buttonLink}</legend>
            <ManagedLinkPicker
              ariaLabel={t.buttonLink}
              error={linkError}
              onChange={(value) => {
                setEditing((prev) => prev ? { ...prev, lien_bouton: value } : prev);
                setLinkError(null);
              }}
              options={linkOptions}
              translations={linkPickerTranslations}
              value={editing.lien_bouton}
            />
          </fieldset>

          <div className="flex justify-end gap-3 border-t pt-6">
            <Button variant="outline" size="sm" onClick={() => setEditing(null)} disabled={isPending}>{t.cancel}</Button>
            <Button size="sm" onClick={handleSave} disabled={isPending || (editing.id === null && !editing.imageFile)}>
              {isPending ? <><Spinner /> {t.saving}</> : t.save}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Slides list ───
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t.title}</h2>
        <div className="flex items-center gap-3">
          {isDirty && (
            <>
              <span className="text-xs text-muted-foreground">{t.dragHint}</span>
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={isOrderSaving}>{t.cancelOrder}</Button>
              <Button size="sm" onClick={handleValidate} disabled={isOrderSaving}>
                {isOrderSaving ? <><Spinner /> {t.validating}</> : t.validate}
              </Button>
            </>
          )}
          <Button size="sm" onClick={startNew}>{t.addSlide}</Button>
        </div>
      </div>

      {orderedSlides.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.noSlides}</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedSlides.map((s) => s.id_image)} strategy={verticalListSortingStrategy}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead className="w-28">{t.image}</TableHead>
                  <TableHead>{t.titleFr}</TableHead>
                  <TableHead className="w-24">{t.active}</TableHead>
                  <TableHead className="w-40" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderedSlides.map((slide, index) => (
                  <SortableSlideRow
                    key={slide.id_image}
                    slide={slide}
                    index={index}
                    translations={t}
                    onEdit={() => startEdit(slide)}
                    onDelete={() => setDeleteTarget(slide)}
                    onToggle={() => handleToggle(slide.id_image)}
                  />
                ))}
              </TableBody>
            </Table>
          </SortableContext>
        </DndContext>
      )}

      {/* Delete confirmation */}
      <Dialog.Root open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/20 supports-backdrop-filter:backdrop-blur-xs" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg sm:p-6">
            <Dialog.Title className="text-base font-semibold">{t.confirmDeleteTitle}</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">{t.confirmDeleteMessage}</Dialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>{t.cancelDelete}</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <><Spinner /> {t.deleting}</> : t.confirmDelete}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Unsaved changes (link navigation) */}
      <Dialog.Root open={showUnsavedDialog} onOpenChange={(open) => { if (!open) cancelNavigation(); }}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/20 supports-backdrop-filter:backdrop-blur-xs" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg sm:p-6">
            <Dialog.Title className="text-base font-semibold">{t.unsavedTitle}</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">{t.unsavedMessage}</Dialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={cancelNavigation}>{t.unsavedStay}</Button>
              <Button variant="destructive" size="sm" onClick={confirmNavigation}>{t.unsavedLeave}</Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
