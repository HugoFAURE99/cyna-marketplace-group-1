"use client";

import { useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { Pencil, Plus, X } from "lucide-react";
import Spinner from "@/components/ui/spinner";

import { useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  createProduct,
  updateProduct,
  type TechnicalCharacteristic,
} from "@/app/[locale]/(admin)/admin/_actions/product.actions";
import { ProductImageUploader } from "@/components/admin/ProductImageUploader";
import { TechnicalCharacteristicsEditor } from "@/components/admin/ProductForm/TechnicalCharacteristicsEditor";
import styles from "./ProductForm.module.scss";

type Category = {
  id_categorie: number;
  cat_nom: string;
};

type Product = {
  id_produit: number;
  id_categorie: number;
  est_disponible: boolean;
  statut_produit: boolean;
  quantite_produit: number;
  prix_tarif: {
    id_prix: number;
    prix: number;
    stripe_price_id: string;
    type_facturation: string;
  }[];
  image_produit?: {
    id_image: number;
    lien_image_produit: string;
    ordre_affichage: number | null;
  }[];
  nom_pro_fr: string;
  pro_description_fr: string;
  nom_pro_en: string;
  pro_description_en: string;
  technical_characteristic_ids: number[];
};

const BILLING_OPTIONS = ["mensuel", "annuel"] as const;
type BillingOption = (typeof BILLING_OPTIONS)[number];

export function AddTranslationButton({
  availableLocales,
  onAdd,
  label,
}: {
  availableLocales: string[];
  onAdd: (locale: string) => void;
  label: (code: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  if (availableLocales.length === 0) return null;

  if (availableLocales.length === 1) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onAdd(availableLocales[0])}
        className="gap-1"
      >
        <Plus className="h-4 w-4" />
        {label(availableLocales[0].toUpperCase())}
      </Button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        className="gap-1"
      >
        <Plus className="h-4 w-4" />
        {label("…")}
      </Button>

      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 rounded-md border bg-popover p-1 shadow-md">
          {availableLocales.map((locale) => (
            <button
              key={locale}
              type="button"
              className="block w-full rounded-sm px-3 py-1.5 text-left text-sm hover:bg-accent"
              onClick={() => {
                onAdd(locale);
                setOpen(false);
              }}
            >
              {locale.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductForm({
  categories,
  characteristics,
  product,
  readOnly,
}: {
  categories: Category[];
  characteristics: TechnicalCharacteristic[];
  product?: Product;
  readOnly?: boolean;
}) {
  const t = useTranslations("admin.productForm");
  const tv = useTranslations("validation");
  const tAdmin = useTranslations("admin");
  const tActions = useTranslations("admin.actions");
  const router = useRouter();

  const [englishEnabled, setEnglishEnabled] = useState(
    Boolean(product?.nom_pro_en || product?.pro_description_en),
  );
  const [technicalCharacteristicIds, setTechnicalCharacteristicIds] = useState<number[]>(
    product?.technical_characteristic_ids ?? [],
  );

  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);

  const existingBillings = product?.prix_tarif.map((t) => t.type_facturation) ?? [];
  const [selectedBillings, setSelectedBillings] = useState<BillingOption[]>(
    existingBillings.filter((b): b is BillingOption =>
      BILLING_OPTIONS.includes(b as BillingOption),
    ),
  );

  const [selectedCategory, setSelectedCategory] = useState<string>(
    product ? String(product.id_categorie) : "",
  );

  const productSchema = useMemo(
    () =>
      z
        .object({
          has_en_translation: z.boolean(),
          nom_pro_fr: z.string().min(1, tv("nameFrRequired")),
          pro_description_fr: z.string().min(1, tv("descriptionFrRequired")),
          nom_pro_en: z.string().optional(),
          pro_description_en: z.string().optional(),
          technical_characteristic_ids: z.array(z.number().int().positive()),
          id_categorie: z.number({ error: tv("categoryRequired") }),
          prix_mensuel: z.number().optional().catch(undefined),
          prix_annuel: z.number().optional().catch(undefined),
          billings: z
            .array(z.enum(["mensuel", "annuel"]))
            .min(1, tv("billingRequired")),
          quantite_produit: z.number().int().min(0),
          statut_produit: z.boolean(),
          est_disponible: z.boolean(),
        })
        .refine(
          (d) => !d.has_en_translation || Boolean(d.nom_pro_en?.trim()),
          { message: tv("nameEnRequired"), path: ["nom_pro_en"] },
        )
        .refine(
          (d) => !d.billings.includes("mensuel") || (d.prix_mensuel ?? 0) > 0,
          { message: tv("pricePositive"), path: ["prix_mensuel"] },
        )
        .refine(
          (d) => !d.billings.includes("annuel") || (d.prix_annuel ?? 0) > 0,
          { message: tv("pricePositive"), path: ["prix_annuel"] },
        ),
    [tv],
  );

  type ProductFormData = z.infer<typeof productSchema>;

  const tarifByType = Object.fromEntries(
    (product?.prix_tarif ?? []).map((t) => [t.type_facturation, t]),
  );

  const [annualTouched, setAnnualTouched] = useState(
    !!tarifByType.annuel,
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          has_en_translation: englishEnabled,
          nom_pro_fr: product.nom_pro_fr,
          pro_description_fr: product.pro_description_fr,
          nom_pro_en: product.nom_pro_en,
          pro_description_en: product.pro_description_en,
          technical_characteristic_ids: product.technical_characteristic_ids,
          id_categorie: product.id_categorie,
          prix_mensuel: tarifByType.mensuel
            ? tarifByType.mensuel.prix / 100
            : undefined,
          prix_annuel: tarifByType.annuel
            ? tarifByType.annuel.prix / 100
            : undefined,
          billings: existingBillings.filter((b): b is BillingOption =>
            BILLING_OPTIONS.includes(b as BillingOption),
          ),
          quantite_produit: product.quantite_produit,
          statut_produit: product.statut_produit,
          est_disponible: product.est_disponible,
        }
      : { billings: [], est_disponible: true, has_en_translation: false, quantite_produit: 0, statut_produit: false, technical_characteristic_ids: [] },
  });
  const monthlyPrice = useWatch({ control, name: "prix_mensuel" });
  const productStatus = useWatch({ control, name: "statut_produit" });
  const productAvailable = useWatch({ control, name: "est_disponible" });

  const toggleBilling = (option: BillingOption) => {
    setSelectedBillings((prev) => {
      const removing = prev.includes(option);
      const next = removing
        ? prev.filter((b) => b !== option)
        : [...prev, option];

      setValue("billings", next, { shouldValidate: true });

      if (removing) {
        const priceKey =
          option === "mensuel" ? "prix_mensuel" : "prix_annuel";
        setValue(priceKey, undefined, { shouldValidate: true });
        if (option === "annuel") setAnnualTouched(false);
      } else if (option === "annuel") {
        setAnnualTouched(false);
        const mensuel = monthlyPrice;
        if (mensuel && mensuel > 0) {
          setValue("prix_annuel", Math.round(mensuel * 12 * 100) / 100);
        }
      }

      return next;
    });
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!data.billings.includes("mensuel")) data.prix_mensuel = undefined;
    if (!data.billings.includes("annuel")) data.prix_annuel = undefined;

    try {
      if (product) {
        await updateProduct(
          product.id_produit,
          data,
          newImageFiles.length > 0 ? newImageFiles : undefined,
          removedImageIds.length > 0 ? removedImageIds : undefined,
        );
      } else {
        await createProduct(
          data,
          newImageFiles.length > 0 ? newImageFiles : undefined,
        );
      }
      router.push("/admin/products");
    } catch {
      alert(tAdmin("saveError"));
    }
  };

  const setEnglishTranslation = (enabled: boolean) => {
    setEnglishEnabled(enabled);
    setValue("has_en_translation", enabled, { shouldValidate: true });
    if (!enabled) {
      setValue("nom_pro_en", "");
      setValue("pro_description_en", "");
    }
  };

  const billingLabels: Record<BillingOption, string> = {
    mensuel: t("monthly"),
    annuel: t("annual"),
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <h2 className="text-2xl font-bold mb-6">
        {product ? t("submitUpdate") : t("submitCreate")}
      </h2>

      {/* Name group */}
      <fieldset className="space-y-3 rounded-lg border p-4">
        <legend className="px-2 text-sm font-semibold">{t("nameGroup")}</legend>

        <div className={styles.field}>
          <Label htmlFor="nom_pro_fr">{t("defaultLang")}</Label>
          <Input id="nom_pro_fr" disabled={readOnly} {...register("nom_pro_fr")} />
          {errors.nom_pro_fr && (
            <span className={styles.error}>{errors.nom_pro_fr.message}</span>
          )}
        </div>

      </fieldset>

      {/* Description group */}
      <fieldset className="space-y-3 rounded-lg border p-4">
        <legend className="px-2 text-sm font-semibold">
          {t("descriptionGroup")}
        </legend>

        <div className={styles.field}>
          <Label htmlFor="pro_description_fr">{t("defaultLang")}</Label>
          <Input id="pro_description_fr" disabled={readOnly} {...register("pro_description_fr")} />
          {errors.pro_description_fr && (
            <span className={styles.error}>
              {errors.pro_description_fr.message}
            </span>
          )}
        </div>

      </fieldset>

      <TechnicalCharacteristicsEditor
        initialOptions={characteristics}
        onChange={(ids) => {
          setTechnicalCharacteristicIds(ids);
          setValue("technical_characteristic_ids", ids, { shouldDirty: true, shouldValidate: true });
        }}
        readOnly={readOnly}
        value={technicalCharacteristicIds}
      />

      {englishEnabled ? (
        <fieldset className="space-y-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <legend className="px-2 text-sm font-semibold">{t("englishTranslation")}</legend>
          {!readOnly && (
            <Button className="float-right -mt-2 gap-1" onClick={() => setEnglishTranslation(false)} size="sm" type="button" variant="ghost">
              <X className="size-4" /> {t("removeTranslation")}
            </Button>
          )}
          <div className={styles.field}>
            <Label htmlFor="nom_pro_en">{t("nameGroup")}</Label>
            <Input id="nom_pro_en" disabled={readOnly} {...register("nom_pro_en")} />
            {errors.nom_pro_en && <span className={styles.error}>{errors.nom_pro_en.message}</span>}
          </div>
          <div className={styles.field}>
            <Label htmlFor="pro_description_en">{t("descriptionGroup")}</Label>
            <Input id="pro_description_en" disabled={readOnly} {...register("pro_description_en")} />
          </div>
        </fieldset>
      ) : !readOnly ? (
        <Button className="w-fit gap-2" onClick={() => setEnglishTranslation(true)} type="button" variant="outline">
          <Plus className="size-4" /> {t("addTranslation", { code: "EN" })}
        </Button>
      ) : null}

      {/* Billing toggle cards */}
      <div className={styles.field}>
        <Label>{t("billing")}</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {BILLING_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={readOnly ? undefined : () => toggleBilling(option)}
              className={`flex-1 rounded-lg border-2 px-4 py-3 text-center text-sm font-medium transition-colors ${
                readOnly ? "cursor-default" : ""
              } ${
                selectedBillings.includes(option)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-muted hover:border-muted-foreground/30"
              }`}
            >
              {billingLabels[option]}
            </button>
          ))}
        </div>
        {errors.billings && (
          <span className={styles.error}>{errors.billings.message}</span>
        )}
      </div>

      {/* Price fields — always visible, disabled when billing not selected */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={`${styles.field} ${!selectedBillings.includes("mensuel") ? "opacity-40" : ""}`}>
          <Label htmlFor="prix_mensuel">{t("priceMonthly")}</Label>
          <Input
            id="prix_mensuel"
            type="number"
            step="0.01"
            disabled={readOnly || !selectedBillings.includes("mensuel")}
            {...register("prix_mensuel", {
              valueAsNumber: true,
              onChange: (e) => {
                const val = parseFloat(e.target.value);
                if (
                  !annualTouched &&
                  selectedBillings.includes("annuel") &&
                  !isNaN(val) &&
                  val > 0
                ) {
                  setValue("prix_annuel", Math.round(val * 12 * 100) / 100);
                }
              },
            })}
          />
          {errors.prix_mensuel && (
            <span className={styles.error}>{errors.prix_mensuel.message}</span>
          )}
        </div>

        <div className={`${styles.field} ${!selectedBillings.includes("annuel") ? "opacity-40" : ""}`}>
          <Label htmlFor="prix_annuel">{t("priceAnnual")}</Label>
          <Input
            id="prix_annuel"
            type="number"
            step="0.01"
            disabled={readOnly || !selectedBillings.includes("annuel")}
            {...register("prix_annuel", {
              valueAsNumber: true,
              onChange: () => setAnnualTouched(true),
            })}
          />
          {errors.prix_annuel && (
            <span className={styles.error}>{errors.prix_annuel.message}</span>
          )}
        </div>
      </div>

      {/* Category select */}
      <div className={styles.field}>
        <Label>{t("category")}</Label>
        <Select
          value={selectedCategory}
          disabled={readOnly}
          onValueChange={(value) => {
            setSelectedCategory(value ?? "");
            setValue("id_categorie", Number(value));
          }}
        >
          <SelectTrigger>
            {selectedCategory
              ? categories.find(
                  (c) => String(c.id_categorie) === selectedCategory,
                )?.cat_nom ?? t("chooseCategory")
              : t("chooseCategory")}
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem
                key={cat.id_categorie}
                label={cat.cat_nom}
                value={String(cat.id_categorie)}
              >
                {cat.cat_nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.id_categorie && (
          <span className={styles.error}>{errors.id_categorie.message}</span>
        )}
      </div>

      {/* Product images */}
      <ProductImageUploader
        initialImages={product?.image_produit}
        onImagesChange={(files, removed) => {
          setNewImageFiles(files);
          setRemovedImageIds(removed);
        }}
        readOnly={readOnly}
      />

      {/* Stock */}
      <div className={styles.field}>
        <Label htmlFor="quantite_produit">{t("stock")}</Label>
        <Input
          id="quantite_produit"
          type="number"
          min="0"
          step="1"
          disabled={readOnly}
          {...register("quantite_produit", { valueAsNumber: true })}
        />
      </div>

      {/* Product status toggle */}
      <div className="grid gap-3 sm:grid-cols-2">
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <Label>{t("status")}</Label>
          <p className="text-sm text-muted-foreground">{t("statusHint")}</p>
        </div>
        <button
          type="button"
          onClick={readOnly ? undefined : () =>
            setValue("statut_produit", !productStatus)
          }
          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${
            readOnly ? "cursor-default" : "cursor-pointer"
          } ${
            productStatus ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              productStatus ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <Label>{t("availability")}</Label>
          <p className="text-sm text-muted-foreground">{t("availabilityHint")}</p>
        </div>
        <button
          aria-label={t("availability")}
          aria-pressed={productAvailable}
          type="button"
          onClick={readOnly ? undefined : () =>
            setValue("est_disponible", !productAvailable)
          }
          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${
            readOnly ? "cursor-default" : "cursor-pointer"
          } ${productAvailable ? "bg-primary" : "bg-muted"}`}
        >
          <span
            className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              productAvailable ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
        {readOnly ? (
          product && (
            <Button type="button" onClick={() => router.push(`/admin/products/${product.id_produit}`)}>
              <Pencil className="mr-1 h-3.5 w-3.5" />
              {tActions("edit")}
            </Button>
          )
        ) : (
          <>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? <><Spinner /> {t("submitting")}</>
                : product
                  ? t("submitUpdate")
                  : t("submitCreate")}
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
