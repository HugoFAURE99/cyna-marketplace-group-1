export type SearchableAdminProduct = {
  categorie?: { cat_nom?: string | null } | null;
  id_produit: number;
  nom_pro: string;
};

export function normalizeAdminProductSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();
}

export function matchesAdminProductSearch(
  product: SearchableAdminProduct,
  query: string,
) {
  const normalizedQuery = normalizeAdminProductSearch(query);
  if (!normalizedQuery) return true;
  const haystack = normalizeAdminProductSearch(
    `${product.id_produit} ${product.nom_pro} ${product.categorie?.cat_nom ?? ""}`,
  );
  return normalizedQuery
    .split(" ")
    .every((term) => haystack.includes(term));
}
