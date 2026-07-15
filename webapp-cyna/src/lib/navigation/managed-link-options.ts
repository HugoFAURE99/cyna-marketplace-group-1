import { pickTranslation, type Locale } from "@/lib/i18n/translations";
import type { ManagedLinkOption } from "@/lib/navigation/managed-link";

export type ManagedLinkOptionLabels = {
  about: string;
  catalog: string;
  categoryFallback: (id: number) => string;
  faq: string;
  home: string;
  legal: string;
  productFallback: (id: number) => string;
  terms: string;
  topProducts: string;
};

export function buildManagedLinkOptions(
  locale: Locale,
  labels: ManagedLinkOptionLabels,
  categories: {
    categorie_traduction: { cat_nom: string; langue: string }[] | null;
    id_categorie: number;
  }[],
  products: {
    id_produit: number;
    produit_traduction: { langue: string; nom_pro: string }[] | null;
  }[],
): ManagedLinkOption[] {
  const staticOptions: ManagedLinkOption[] = [
    { href: "/", kind: "page", label: labels.home },
    { href: "/search", kind: "page", label: labels.catalog },
    { href: "/faq", kind: "page", label: labels.faq },
    { href: "/about", kind: "page", label: labels.about },
    { href: "/legal", kind: "page", label: labels.legal },
    { href: "/terms", kind: "page", label: labels.terms },
    { href: "#top-products", kind: "anchor", label: labels.topProducts },
  ];
  const categoryOptions: ManagedLinkOption[] = categories
    .map((category) => ({
      href: `/categories/${category.id_categorie}`,
      kind: "category" as const,
      label:
        pickTranslation(category.categorie_traduction, locale)?.cat_nom ||
        labels.categoryFallback(category.id_categorie),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));
  const productOptions: ManagedLinkOption[] = products
    .map((product) => ({
      href: `/products/${product.id_produit}`,
      kind: "product" as const,
      label:
        pickTranslation(product.produit_traduction, locale)?.nom_pro ||
        labels.productFallback(product.id_produit),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));

  return [...staticOptions, ...categoryOptions, ...productOptions];
}
