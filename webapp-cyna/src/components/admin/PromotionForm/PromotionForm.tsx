"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, X, Search } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog } from "@base-ui/react/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Spinner from "@/components/ui/spinner";
import {
  createPromotion,
  updatePromotion,
  type PromotionDetail,
} from "@/app/[locale]/(admin)/admin/_actions/promotion.actions";

type SimpleItem = { id: number; nom: string };
type ProductItem = { id_produit: number; nom: string };
type CategoryItem = { id_categorie: number; nom: string };

interface Props {
  promotion?: PromotionDetail | null;
  allProducts: ProductItem[];
  allCategories: CategoryItem[];
}

export default function PromotionForm({ promotion, allProducts, allCategories }: Props) {
  const t = useTranslations("admin.promotions.form");
  const router = useRouter();
  const isEdit = !!promotion;

  const [typeRemise, setTypeRemise] = useState(promotion?.type_remise || "pourcentage");
  const [valeurRemise, setValeurRemise] = useState(String(promotion?.valeur_remise ?? ""));
  const [dateExpiration, setDateExpiration] = useState(
    promotion?.date_expiration ? promotion.date_expiration.split("T")[0] : ""
  );
  const [isActif, setIsActif] = useState(promotion?.is_actif ?? true);
  const [isCodePromo, setIsCodePromo] = useState(promotion?.is_code_promo ?? false);
  const [codePromo, setCodePromo] = useState(promotion?.code_promo || "");
  const [noExpiration, setNoExpiration] = useState(
    promotion?.date_expiration ? new Date(promotion.date_expiration).getFullYear() > 2099 : false
  );
  const [isGlobal, setIsGlobal] = useState(
    promotion ? promotion.produits.length === 0 && promotion.categories.length === 0 : false
  );
  const [duration, setDuration] = useState(promotion?.stripe_duration || "once");
  const [dureeMois, setDureeMois] = useState(String(promotion?.duree_mois ?? ""));

  const [selectedProducts, setSelectedProducts] = useState<SimpleItem[]>(
    promotion?.produits.map((p) => ({ id: p.id_produit, nom: p.nom })) || []
  );
  const [selectedCategories, setSelectedCategories] = useState<SimpleItem[]>(
    promotion?.categories.map((c) => ({ id: c.id_categorie, nom: c.nom })) || []
  );

  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        type_remise: typeRemise,
        valeur_remise: Number(valeurRemise),
        date_expiration: noExpiration ? "2999-12-31" : dateExpiration,
        is_actif: isActif,
        is_code_promo: isCodePromo,
        lien_image_promo: promotion?.lien_image_promo || null,
        code_promo: isCodePromo ? codePromo : null,
        produit_ids: isGlobal ? [] : selectedProducts.map((p) => p.id),
        categorie_ids: isGlobal ? [] : selectedCategories.map((c) => c.id),
        stripe_duration: duration,
        duree_mois:
          duration === "repeating" && dureeMois ? Number(dureeMois) : null,
      };

      if (isEdit && promotion) {
        await updatePromotion(promotion.id_promotion, payload);
      } else {
        await createPromotion(payload);
      }

      router.push("/admin/promotions");
    } catch {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold">
        {isEdit ? t("editTitle") : t("createTitle")}
      </h2>

      <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-5">
        {/* Type + Valeur on same line */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex-1">
            <Label>{t("typeRemise")}</Label>
            <select
              value={typeRemise}
              onChange={(e) => setTypeRemise(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="pourcentage">{t("percentage")}</option>
              <option value="fixe">{t("fixed")}</option>
            </select>
          </div>
          <div className="flex-1">
            <Label>{t("value")}</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={valeurRemise}
              onChange={(e) => setValeurRemise(e.target.value)}
              required
              className="mt-1"
            />
          </div>
        </div>

        {/* Date expiration + no expiration toggle */}
        <div>
          <Label>{t("expiration")}</Label>
          <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              type="date"
              value={dateExpiration}
              onChange={(e) => setDateExpiration(e.target.value)}
              required={!noExpiration}
              disabled={noExpiration}
              className={noExpiration ? "flex-1 opacity-40" : "flex-1"}
            />
            <label className="flex items-center gap-2 whitespace-nowrap text-sm">
              <button
                type="button"
                onClick={() => setNoExpiration(!noExpiration)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${noExpiration ? "bg-primary" : "bg-muted"}`}
              >
                <span
                  className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${noExpiration ? "translate-x-4" : "translate-x-0"}`}
                />
              </button>
              {t("noExpiration")}
            </label>
          </div>
        </div>

        {/* Actif */}
        <div className="flex items-center gap-3">
          <Label>{t("active")}</Label>
          <button
            type="button"
            onClick={() => setIsActif(!isActif)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${isActif ? "bg-primary" : "bg-muted"}`}
          >
            <span
              className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${isActif ? "translate-x-4" : "translate-x-0"}`}
            />
          </button>
        </div>

        {/* Discount duration (Stripe) */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex-1">
            <Label>{t("duration")}</Label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="once">{t("durationOnce")}</option>
              <option value="forever">{t("durationForever")}</option>
              <option value="repeating">{t("durationRepeating")}</option>
            </select>
          </div>
          {duration === "repeating" && (
            <div className="flex-1">
              <Label>{t("durationMonths")}</Label>
              <Input
                type="number"
                min="1"
                value={dureeMois}
                onChange={(e) => setDureeMois(e.target.value)}
                required
                className="mt-1"
              />
            </div>
          )}
        </div>

        {/* Code promo / Automatique toggle */}
        <div>
          <Label className="mb-2 block">{t("promoMode")}</Label>
          <div className="grid w-full grid-cols-2 rounded-lg border bg-muted p-0.5 sm:inline-flex sm:w-auto">
            <button
              type="button"
              onClick={() => setIsCodePromo(false)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                !isCodePromo
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("automatic")}
            </button>
            <button
              type="button"
              onClick={() => setIsCodePromo(true)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                isCodePromo
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("codePromo")}
            </button>
          </div>
        </div>

        {/* Code promo field */}
        {isCodePromo && (
          <div>
            <Label>{t("codeLabel")}</Label>
            <Input
              type="text"
              value={codePromo}
              onChange={(e) => setCodePromo(e.target.value.toUpperCase())}
              placeholder="SUMMER20"
              required
              className="mt-1 font-mono"
            />
          </div>
        )}

        {/* Global toggle */}
        <div className="flex items-center gap-3">
          <Label>{t("globalOrder")}</Label>
          <button
            type="button"
            onClick={() => setIsGlobal(!isGlobal)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${isGlobal ? "bg-primary" : "bg-muted"}`}
          >
            <span
              className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${isGlobal ? "translate-x-4" : "translate-x-0"}`}
            />
          </button>
          <span className="text-xs text-muted-foreground">
            {isGlobal ? t("globalOrderHint") : t("targetedHint")}
          </span>
        </div>

        {/* Selected products */}
        <div className={isGlobal ? "pointer-events-none opacity-40" : ""}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label>{t("targetProducts")}</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowProductPicker(true)}
              disabled={isGlobal}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              {t("addProducts")}
            </Button>
          </div>
          {selectedProducts.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedProducts.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                >
                  {p.nom}
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedProducts((prev) => prev.filter((x) => x.id !== p.id))
                    }
                    className="ml-0.5 hover:text-blue-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">{t("noProductsSelected")}</p>
          )}
        </div>

        {/* Selected categories */}
        <div className={isGlobal ? "pointer-events-none opacity-40" : ""}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label>{t("targetCategories")}</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCategoryPicker(true)}
              disabled={isGlobal}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              {t("addCategories")}
            </Button>
          </div>
          {selectedCategories.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedCategories.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
                >
                  {c.nom}
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedCategories((prev) => prev.filter((x) => x.id !== c.id))
                    }
                    className="ml-0.5 hover:text-green-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">{t("noCategoriesSelected")}</p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
          <Button
            disabled={saving}
            onClick={() => router.back()}
            type="button"
            variant="outline"
          >
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Spinner /> {t("saving")}
              </>
            ) : isEdit ? (
              t("save")
            ) : (
              t("create")
            )}
          </Button>
        </div>
      </form>

      {/* Product picker modal */}
      <PickerModal
        open={showProductPicker}
        onClose={() => setShowProductPicker(false)}
        title={t("pickProducts")}
        searchPlaceholder={t("searchProducts")}
        items={allProducts.map((p) => ({ id: p.id_produit, nom: p.nom }))}
        selected={selectedProducts}
        onConfirm={(items) => {
          setSelectedProducts(items);
          setShowProductPicker(false);
        }}
      />

      {/* Category picker modal */}
      <PickerModal
        open={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        title={t("pickCategories")}
        searchPlaceholder={t("searchCategories")}
        items={allCategories.map((c) => ({ id: c.id_categorie, nom: c.nom }))}
        selected={selectedCategories}
        onConfirm={(items) => {
          setSelectedCategories(items);
          setShowCategoryPicker(false);
        }}
      />
    </div>
  );
}

function PickerModal({
  open,
  onClose,
  title,
  searchPlaceholder,
  items,
  selected,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  searchPlaceholder: string;
  items: SimpleItem[];
  selected: SimpleItem[];
  onConfirm: (items: SimpleItem[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [checked, setChecked] = useState<Set<number>>(
    new Set(selected.map((s) => s.id))
  );
  const t = useTranslations("admin.promotions.form");

  const filtered = items.filter((item) =>
    item.nom.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (item: SimpleItem) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const result = items.filter((i) => checked.has(i.id));
    onConfirm(result);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/20 supports-backdrop-filter:backdrop-blur-xs" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg sm:p-6">
          <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>

          <div className="relative mt-3">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border bg-background pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="mt-3 overflow-y-auto flex-1 max-h-64">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>ID</TableHead>
                  <TableHead>{t("name")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                      {t("noResults")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => toggle(item)}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={checked.has(item.id)}
                          onChange={() => toggle(item)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">#{item.id}</TableCell>
                      <TableCell>{item.nom}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Dialog.Close render={<Button variant="outline" size="sm" />}>
              {t("cancel")}
            </Dialog.Close>
            <Button size="sm" onClick={handleConfirm}>
              {t("confirm")} ({checked.size})
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
