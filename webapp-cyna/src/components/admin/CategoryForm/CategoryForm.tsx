"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { Plus, X } from "lucide-react";
import Spinner from "@/components/ui/spinner";

import { useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CategoryImageUploader } from "@/components/admin/CategoryImageUploader";
import {
  createCategory,
  updateCategory,
} from "@/app/[locale]/(admin)/admin/_actions/category.actions";
import styles from "./CategoryForm.module.scss";

type Category = {
  id_categorie: number;
  cat_nom_fr: string;
  cat_description_fr: string;
  cat_nom_en: string;
  cat_description_en: string;
  lien_image_cat?: string | null;
};

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

  const [englishEnabled, setEnglishEnabled] = useState(
    Boolean(category?.cat_nom_en || category?.cat_description_en),
  );

  const categorySchema = useMemo(
    () =>
      z.object({
        has_en_translation: z.boolean(),
        cat_nom_fr: z.string().min(1, tv("nameFrRequired")),
        cat_description_fr: z.string().optional(),
        cat_nom_en: z.string().optional(),
        cat_description_en: z.string().optional(),
      }).refine(
        (data) => !data.has_en_translation || Boolean(data.cat_nom_en?.trim()),
        { message: tv("nameEnRequired"), path: ["cat_nom_en"] },
      ),
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
          has_en_translation: englishEnabled,
          cat_nom_fr: category.cat_nom_fr,
          cat_description_fr: category.cat_description_fr || "",
          cat_nom_en: category.cat_nom_en,
          cat_description_en: category.cat_description_en || "",
        }
      : { has_en_translation: false },
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

  const setEnglishTranslation = (enabled: boolean) => {
    setEnglishEnabled(enabled);
    setValue("has_en_translation", enabled, { shouldValidate: true });
    if (!enabled) {
      setValue("cat_nom_en", "");
      setValue("cat_description_en", "");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
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

      </fieldset>

      {englishEnabled ? (
        <fieldset className="space-y-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <legend className="px-2 text-sm font-semibold">{t("englishTranslation")}</legend>
          {!readOnly && (
            <Button className="float-right -mt-2 gap-1" onClick={() => setEnglishTranslation(false)} size="sm" type="button" variant="ghost">
              <X className="size-4" /> {t("removeTranslation")}
            </Button>
          )}
          <div className={styles.field}>
            <Label htmlFor="cat_nom_en">{t("nameGroup")}</Label>
            <Input id="cat_nom_en" disabled={readOnly} {...register("cat_nom_en")} />
            {errors.cat_nom_en && <span className={styles.error}>{errors.cat_nom_en.message}</span>}
          </div>
          <div className={styles.field}>
            <Label htmlFor="cat_description_en">{t("descriptionGroup")}</Label>
            <Input id="cat_description_en" disabled={readOnly} {...register("cat_description_en")} />
          </div>
        </fieldset>
      ) : !readOnly ? (
        <Button className="w-fit gap-2" onClick={() => setEnglishTranslation(true)} type="button" variant="outline">
          <Plus className="size-4" /> {t("addTranslation", { code: "EN" })}
        </Button>
      ) : null}

      <div className="mt-6 pt-6 border-t">
        {readOnly ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("image")}</h3>
            {category?.lien_image_cat ? (
              <Image
                src={category.lien_image_cat}
                alt=""
                className="max-w-xs rounded-lg border shadow-md"
                height={240}
                unoptimized
                width={320}
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

      <div className="mt-6 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
        {readOnly ? (
          category && (
            <Button type="button" onClick={() => router.push(`/admin/categories/${category.id_categorie}`)}>
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
