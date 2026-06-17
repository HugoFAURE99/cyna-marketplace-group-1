"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";

import { useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
};

export default function CategoryForm({
  category,
}: {
  category?: Category;
} = {}) {
  const t = useTranslations("admin.categoryForm");
  const tv = useTranslations("validation");
  const tAdmin = useTranslations("admin");
  const router = useRouter();

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
        await updateCategory(category.id_categorie, data);
      } else {
        await createCategory(data);
      }
      router.push("/admin/categories");
    } catch {
      alert(tAdmin("saveError"));
    }
  };

  return (
    <div className={styles.form}>
      <div className={styles.field}>
        <Label htmlFor="cat_nom_fr">{t("nameFr")}</Label>
        <Input id="cat_nom_fr" {...register("cat_nom_fr")} />
        {errors.cat_nom_fr && (
          <span className={styles.error}>{errors.cat_nom_fr.message}</span>
        )}
      </div>

      <div className={styles.field}>
        <Label htmlFor="cat_nom_en">{t("nameEn")}</Label>
        <Input id="cat_nom_en" {...register("cat_nom_en")} />
      </div>

      <div className={styles.field}>
        <Label htmlFor="cat_description_fr">{t("descriptionFr")}</Label>
        <Input id="cat_description_fr" {...register("cat_description_fr")} />
      </div>

      <div className={styles.field}>
        <Label htmlFor="cat_description_en">{t("descriptionEn")}</Label>
        <Input id="cat_description_en" {...register("cat_description_en")} />
      </div>

      <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
        {isSubmitting
          ? t("submitting")
          : category
            ? t("submitUpdate")
            : t("submitCreate")}
      </Button>
    </div>
  );
}
