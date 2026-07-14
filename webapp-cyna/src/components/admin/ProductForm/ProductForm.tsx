"use client";

import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { ArrowLeft, Pencil, Plus, X } from "lucide-react";
import Spinner from "@/components/ui/spinner";

import { useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createProduct,
  updateProduct,
} from "@/app/[locale]/(admin)/admin/_actions/product.actions";
import { ProductImageUploader } from "@/components/admin/ProductImageUploader";
import styles from "./ProductForm.module.scss";

const DEFAULT_LOCALE = routing.defaultLocale;
const EXTRA_LOCALES = routing.locales.filter((l) => l !== DEFAULT_LOCALE);

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
  pro_carac_technique_fr: string;
  nom_pro_en: string;
  pro_description_en: string;
  pro_carac_technique_en: string;
};

const BILLING_OPTIONS = ["mensuel", "annuel"] as const;
type BillingOption = (typeof BILLING_OPTIONS)[number];

function AddTranslationButton({
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
  product,
  readOnly,
}: {
  categories: Category[];
  product?: Product;
  readOnly?: boolean;
}) {
  const t = useTranslations("admin.productForm");
  const tv = useTranslations("validation");
  const tAdmin = useTranslations("admin");
  const tActions = useTranslations("admin.actions");
  const router = useRouter();

  const initialNameLocales = readOnly
    ? EXTRA_LOCALES
    : EXTRA_LOCALES.filter((l) => product?.[`nom_pro_${l}` as keyof Product]);
  const initialDescLocales = readOnly
    ? EXTRA_LOCALES
    : EXTRA_LOCALES.filter((l) => product?.[`pro_description_${l}` as keyof Product]);
  const initialSpecsLocales = readOnly
    ? EXTRA_LOCALES
    : EXTRA_LOCALES.filter((l) => product?.[`pro_carac_technique_${l}` as keyof Product]);

  const [nameLocales, setNameLocales] = useState<string[]>(initialNameLocales);
  const [descLocales, setDescLocales] = useState<string[]>(initialDescLocales);
  const [specsLocales, setSpecsLocales] =
    useState<string[]>(initialSpecsLocales);

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
          nom_pro_fr: z.string().min(1, tv("nameFrRequired")),
          pro_description_fr: z.string().min(1, tv("descriptionFrRequired")),
          pro_carac_technique_fr: z.string().optional(),
          nom_pro_en: z.string().optional(),
          pro_description_en: z.string().optional(),
          pro_carac_technique_en: z.string().optional(),
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
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          nom_pro_fr: product.nom_pro_fr,
          pro_description_fr: product.pro_description_fr,
          pro_carac_technique_fr: product.pro_carac_technique_fr ?? "",
          nom_pro_en: product.nom_pro_en,
          pro_description_en: product.pro_description_en,
          pro_carac_technique_en: product.pro_carac_technique_en ?? "",
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
      : { billings: [], est_disponible: true, quantite_produit: 0, statut_produit: false },
  });

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
        const mensuel = watch("prix_mensuel");
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

  const addLocale = (group: string, locale: string) => {
    const setters: Record<string, React.Dispatch<React.SetStateAction<string[]>>> = {
      name: setNameLocales,
      description: setDescLocales,
      specs: setSpecsLocales,
    };
    setters[group]?.((prev) => [...prev, locale]);
  };

  const removeLocale = (group: string, locale: string) => {
    const fieldMap: Record<string, keyof ProductFormData> = {
      name: `nom_pro_${locale}` as keyof ProductFormData,
      description: `pro_description_${locale}` as keyof ProductFormData,
      specs: `pro_carac_technique_${locale}` as keyof ProductFormData,
    };
    const setters: Record<string, React.Dispatch<React.SetStateAction<string[]>>> = {
      name: setNameLocales,
      description: setDescLocales,
      specs: setSpecsLocales,
    };
    setters[group]?.((prev) => prev.filter((l) => l !== locale));
    setValue(fieldMap[group], "");
  };

  const availableFor = (active: string[]) =>
    EXTRA_LOCALES.filter((l) => !active.includes(l));

  const billingLabels: Record<BillingOption, string> = {
    mensuel: t("monthly"),
    annuel: t("annual"),
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {tActions("back")}
      </button>
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

        {nameLocales.map((locale) => (
          <div key={locale} className={styles.field}>
            <div className="flex items-center justify-between">
              <Label htmlFor={`nom_pro_${locale}`}>
                {t("lang", { code: locale.toUpperCase() })}
              </Label>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removeLocale("name", locale)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Input
              id={`nom_pro_${locale}`}
              disabled={readOnly}
              {...register(`nom_pro_${locale}` as keyof ProductFormData)}
            />
          </div>
        ))}

        {!readOnly && (
          <AddTranslationButton
            availableLocales={availableFor(nameLocales)}
            onAdd={(l) => addLocale("name", l)}
            label={(code) => t("addTranslation", { code })}
          />
        )}
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

        {descLocales.map((locale) => (
          <div key={locale} className={styles.field}>
            <div className="flex items-center justify-between">
              <Label htmlFor={`pro_description_${locale}`}>
                {t("lang", { code: locale.toUpperCase() })}
              </Label>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removeLocale("description", locale)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Input
              id={`pro_description_${locale}`}
              disabled={readOnly}
              {...register(
                `pro_description_${locale}` as keyof ProductFormData,
              )}
            />
          </div>
        ))}

        {!readOnly && (
          <AddTranslationButton
            availableLocales={availableFor(descLocales)}
            onAdd={(l) => addLocale("description", l)}
            label={(code) => t("addTranslation", { code })}
          />
        )}
      </fieldset>

      {/* Specs group */}
      <fieldset className="space-y-3 rounded-lg border p-4">
        <legend className="px-2 text-sm font-semibold">
          {t("specsGroup")}
        </legend>

        <div className={styles.field}>
          <Label htmlFor="pro_carac_technique_fr">{t("defaultLang")}</Label>
          <Input
            id="pro_carac_technique_fr"
            disabled={readOnly}
            {...register("pro_carac_technique_fr")}
          />
        </div>

        {specsLocales.map((locale) => (
          <div key={locale} className={styles.field}>
            <div className="flex items-center justify-between">
              <Label htmlFor={`pro_carac_technique_${locale}`}>
                {t("lang", { code: locale.toUpperCase() })}
              </Label>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removeLocale("specs", locale)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Input
              id={`pro_carac_technique_${locale}`}
              disabled={readOnly}
              {...register(
                `pro_carac_technique_${locale}` as keyof ProductFormData,
              )}
            />
          </div>
        ))}

        {!readOnly && (
          <AddTranslationButton
            availableLocales={availableFor(specsLocales)}
            onAdd={(l) => addLocale("specs", l)}
            label={(code) => t("addTranslation", { code })}
          />
        )}
      </fieldset>

      {/* Billing toggle cards */}
      <div className={styles.field}>
        <Label>{t("billing")}</Label>
        <div className="flex gap-3">
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
      <div className="grid grid-cols-2 gap-4">
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
            setValue("statut_produit", !watch("statut_produit"))
          }
          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${
            readOnly ? "cursor-default" : "cursor-pointer"
          } ${
            watch("statut_produit") ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              watch("statut_produit") ? "translate-x-5" : "translate-x-0"
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
          aria-pressed={watch("est_disponible")}
          type="button"
          onClick={readOnly ? undefined : () =>
            setValue("est_disponible", !watch("est_disponible"))
          }
          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${
            readOnly ? "cursor-default" : "cursor-pointer"
          } ${watch("est_disponible") ? "bg-primary" : "bg-muted"}`}
        >
          <span
            className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              watch("est_disponible") ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
        {readOnly ? (
          <>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              {tActions("back")}
            </Button>
            {product && (
              <Button type="button" onClick={() => router.push(`/admin/products/${product.id_produit}`)}>
                <Pencil className="mr-1 h-3.5 w-3.5" />
                {tActions("edit")}
              </Button>
            )}
          </>
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
