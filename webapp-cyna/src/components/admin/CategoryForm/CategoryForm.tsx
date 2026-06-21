"use client";

import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { ArrowLeft, Plus, X } from "lucide-react";
import Spinner from "@/components/ui/spinner";

import { useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CategoryImageUploader } from "@/components/admin/CategoryImageUploader";
import {
  createCategory,
  updateCategory,
} from "@/app/[locale]/(admin)/admin/_actions/category.actions";
import styles from "./CategoryForm.module.scss";

const DEFAULT_LOCALE = routing.defaultLocale;
const EXTRA_LOCALES = routing.locales.filter((l) => l !== DEFAULT_LOCALE);

type Category = {
  id_categorie: number;
  cat_nom_fr: string;
  cat_description_fr: string;
  cat_nom_en: string;
  cat_description_en: string;
  lien_image_cat?: string | null;
};

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

export default function CategoryForm({
  category,
  readOnly,
}: {
  category?: Category;
  readOnly?: boolean;
} = {}) {
  const t = useTranslations("admin.categoryForm");
  const tv = useTranslations("validation");
  const tAdmin = useTranslations("admin");
  const tActions = useTranslations("admin.actions");
  const router = useRouter();
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const initialNameLocales = readOnly
    ? EXTRA_LOCALES
    : EXTRA_LOCALES.filter((l) => {
        const key = `cat_nom_${l}` as keyof Category;
        return category?.[key];
      });
  const initialDescLocales = readOnly
    ? EXTRA_LOCALES
    : EXTRA_LOCALES.filter((l) => {
        const key = `cat_description_${l}` as keyof Category;
        return category?.[key];
      });

  const [nameLocales, setNameLocales] = useState<string[]>(initialNameLocales);
  const [descLocales, setDescLocales] = useState<string[]>(initialDescLocales);

  const categorySchema = useMemo(
    () =>
      z.object({
        cat_nom_fr: z.string().min(1, tv("nameFrRequired")),
        cat_description_fr: z.string().optional(),
        cat_nom_en: z.string().optional(),
        cat_description_en: z.string().optional(),
      }),
    [tv],
  );

  type CategoryFormData = z.infer<typeof categorySchema>;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: category
      ? {
          cat_nom_fr: category.cat_nom_fr,
          cat_description_fr: category.cat_description_fr || "",
          cat_nom_en: category.cat_nom_en,
          cat_description_en: category.cat_description_en || "",
        }
      : undefined,
  });

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (category) {
        await updateCategory(category.id_categorie, data, selectedImageFile);
      } else {
        await createCategory(data, selectedImageFile);
      }
      router.push("/admin/categories");
    } catch {
      alert(tAdmin("saveError"));
    }
  };

  const addLocale = (group: "name" | "description", locale: string) => {
    if (group === "name") {
      setNameLocales((prev) => [...prev, locale]);
    } else {
      setDescLocales((prev) => [...prev, locale]);
    }
  };

  const removeLocale = (group: "name" | "description", locale: string) => {
    if (group === "name") {
      setNameLocales((prev) => prev.filter((l) => l !== locale));
      setValue(`cat_nom_${locale}` as keyof CategoryFormData, "");
    } else {
      setDescLocales((prev) => prev.filter((l) => l !== locale));
      setValue(`cat_description_${locale}` as keyof CategoryFormData, "");
    }
  };

  const availableNameLocales = EXTRA_LOCALES.filter(
    (l) => !nameLocales.includes(l),
  );
  const availableDescLocales = EXTRA_LOCALES.filter(
    (l) => !descLocales.includes(l),
  );

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
        {category ? t("editTitle") : t("createTitle")}
      </h2>

      <fieldset className="space-y-3 rounded-lg border p-4">
        <legend className="px-2 text-sm font-semibold">{t("nameGroup")}</legend>

        <div className={styles.field}>
          <Label htmlFor="cat_nom_fr">{t("defaultLang")}</Label>
          <Input id="cat_nom_fr" disabled={readOnly} {...register("cat_nom_fr")} />
          {errors.cat_nom_fr && (
            <span className={styles.error}>{errors.cat_nom_fr.message}</span>
          )}
        </div>

        {nameLocales.map((locale) => (
          <div key={locale} className={styles.field}>
            <div className="flex items-center justify-between">
              <Label htmlFor={`cat_nom_${locale}`}>
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
              id={`cat_nom_${locale}`}
              disabled={readOnly}
              {...register(`cat_nom_${locale}` as keyof CategoryFormData)}
            />
          </div>
        ))}

        {!readOnly && (
          <AddTranslationButton
            availableLocales={availableNameLocales}
            onAdd={(locale) => addLocale("name", locale)}
            label={(code) => t("addTranslation", { code })}
          />
        )}
      </fieldset>

      <fieldset className="space-y-3 rounded-lg border p-4">
        <legend className="px-2 text-sm font-semibold">
          {t("descriptionGroup")}
        </legend>

        <div className={styles.field}>
          <Label htmlFor="cat_description_fr">{t("defaultLang")}</Label>
          <Input
            id="cat_description_fr"
            disabled={readOnly}
            {...register("cat_description_fr")}
          />
        </div>

        {descLocales.map((locale) => (
          <div key={locale} className={styles.field}>
            <div className="flex items-center justify-between">
              <Label htmlFor={`cat_description_${locale}`}>
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
              id={`cat_description_${locale}`}
              disabled={readOnly}
              {...register(
                `cat_description_${locale}` as keyof CategoryFormData,
              )}
            />
          </div>
        ))}

        {!readOnly && (
          <AddTranslationButton
            availableLocales={availableDescLocales}
            onAdd={(locale) => addLocale("description", locale)}
            label={(code) => t("addTranslation", { code })}
          />
        )}
      </fieldset>

      <div className="mt-6 pt-6 border-t">
        {readOnly ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("image")}</h3>
            {category?.lien_image_cat ? (
              <img
                src={category.lien_image_cat}
                alt=""
                className="max-w-xs rounded-lg border shadow-md"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{t("noImage")}</p>
            )}
          </div>
        ) : (
          <CategoryImageUploader
            initialImageUrl={category?.lien_image_cat}
            onFileSelect={setSelectedImageFile}
          />
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
        {readOnly ? (
          <>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              {tActions("back")}
            </Button>
            {category && (
              <Button type="button" onClick={() => router.push(`/admin/categories/${category.id_categorie}`)}>
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
                : category
                  ? t("submitUpdate")
                  : t("submitCreate")}
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
