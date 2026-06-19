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
import styles from "./ProductForm.module.scss";

type Category = {
  id_categorie: number;
  cat_nom: string;
};

type Product = {
  id_produit: number;
  id_categorie: number;
  prix_tarif: {
    id_prix: number;
    prix: number;
    stripe_price_id: string;
    type_facturation: string;
  }[];
  nom_pro_fr: string;
  pro_description_fr: string;
  pro_carac_technique_fr: string;
  nom_pro_en: string;
  pro_description_en: string;
  pro_carac_technique_en: string;
};

export default function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: Product;
}) {
  const t = useTranslations("admin.productForm");
  const tv = useTranslations("validation");
  const tAdmin = useTranslations("admin");
  const router = useRouter();
  const tarif = product?.prix_tarif?.[0];
  const categoryLabels = new Map(
    categories.map((category) => [
      String(category.id_categorie),
      category.cat_nom,
    ] as const),
  );

  const productSchema = useMemo(
    () =>
      z.object({
        nom_pro_fr: z.string().min(1, tv("nameFrRequired")),
        pro_description_fr: z.string().min(1, tv("descriptionFrRequired")),
        pro_carac_technique_fr: z.string().optional(),
        nom_pro_en: z.string().optional(),
        pro_description_en: z.string().optional(),
        pro_carac_technique_en: z.string().optional(),
        id_categorie: z.number({ error: tv("categoryRequired") }),
        prix: z
          .number({ error: tv("pricePositive") })
          .positive(tv("pricePositive")),
        type_facturation: z.enum(["mensuel", "annuel", "unique"], {
          error: tv("billingRequired"),
        }),
      }),
    [tv],
  );

  type ProductFormData = z.infer<typeof productSchema>;

  const {
    register,
    handleSubmit,
    setValue,
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
          prix: tarif ? tarif.prix / 100 : undefined,
          type_facturation:
            tarif?.type_facturation as ProductFormData["type_facturation"],
        }
      : undefined,
  });

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (product) {
        await updateProduct(product.id_produit, data);
      } else {
        await createProduct(data);
      }
      router.push("/admin/products");
    } catch {
      alert(tAdmin("saveError"));
    }
  };

  return (
    <div className={styles.form}>
      <div className={styles.field}>
        <Label htmlFor="nom_pro_fr">{t("nameFr")}</Label>
        <Input id="nom_pro_fr" {...register("nom_pro_fr")} />
        {errors.nom_pro_fr && (
          <span className={styles.error}>{errors.nom_pro_fr.message}</span>
        )}
      </div>

      <div className={styles.field}>
        <Label htmlFor="nom_pro_en">{t("nameEn")}</Label>
        <Input id="nom_pro_en" {...register("nom_pro_en")} />
      </div>

      <div className={styles.field}>
        <Label htmlFor="pro_description_fr">{t("descriptionFr")}</Label>
        <Input id="pro_description_fr" {...register("pro_description_fr")} />
        {errors.pro_description_fr && (
          <span className={styles.error}>
            {errors.pro_description_fr.message}
          </span>
        )}
      </div>

      <div className={styles.field}>
        <Label htmlFor="pro_description_en">{t("descriptionEn")}</Label>
        <Input id="pro_description_en" {...register("pro_description_en")} />
      </div>

      <div className={styles.field}>
        <Label htmlFor="pro_carac_technique_fr">{t("specsFr")}</Label>
        <Input
          id="pro_carac_technique_fr"
          {...register("pro_carac_technique_fr")}
        />
      </div>

      <div className={styles.field}>
        <Label htmlFor="pro_carac_technique_en">{t("specsEn")}</Label>
        <Input
          id="pro_carac_technique_en"
          {...register("pro_carac_technique_en")}
        />
      </div>

      <div className={styles.field}>
        <Label htmlFor="prix">{t("price")}</Label>
        <Input
          id="prix"
          type="number"
          step="0.01"
          {...register("prix", { valueAsNumber: true })}
        />
        {errors.prix && (
          <span className={styles.error}>{errors.prix.message}</span>
        )}
      </div>

      <div className={styles.field}>
        <Label>{t("billing")}</Label>
        <Select
          defaultValue={tarif?.type_facturation}
          onValueChange={(value) =>
            setValue(
              "type_facturation",
              value as ProductFormData["type_facturation"],
            )
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t("chooseBilling")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mensuel">{t("monthly")}</SelectItem>
            <SelectItem value="annuel">{t("annual")}</SelectItem>
            <SelectItem value="unique">{t("oneTime")}</SelectItem>
          </SelectContent>
        </Select>
        {errors.type_facturation && (
          <span className={styles.error}>
            {errors.type_facturation.message}
          </span>
        )}
      </div>

      <div className={styles.field}>
        <Label>{t("category")}</Label>
        <Select
          defaultValue={product ? String(product.id_categorie) : undefined}
          onValueChange={(value) => setValue("id_categorie", Number(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("chooseCategory")}>
              {(value) =>
                categoryLabels.get(String(value)) ?? t("chooseCategory")
              }
            </SelectValue>
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

      <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
        {isSubmitting
          ? t("submitting")
          : product
            ? t("submitUpdate")
            : t("submitCreate")}
      </Button>
    </div>
  );
}
