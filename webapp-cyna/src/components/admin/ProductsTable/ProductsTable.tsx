import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { getProducts } from "@/app/[locale]/(admin)/admin/_actions/product.actions";
import DeleteProductButton from "@/components/admin/ProductsTable/DeleteProductButton";

type Product = Awaited<ReturnType<typeof getProducts>>[number];

export default async function ProductsTable({
  products,
}: {
  products: Product[];
}) {
  const t = await getTranslations("admin.products.table");
  const tActions = await getTranslations("admin.actions");

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("name")}</TableHead>
          <TableHead>{t("category")}</TableHead>
          <TableHead>{t("status")}</TableHead>
          <TableHead>{t("price")}</TableHead>
          <TableHead>{t("stripeId")}</TableHead>
          <TableHead>{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => {
          const tarif = product.prix_tarif?.[0];
          return (
            <TableRow key={product.id_produit}>
              <TableCell>{product.nom_pro}</TableCell>
              <TableCell>{product.categorie?.cat_nom || "—"}</TableCell>
              <TableCell>
                {product.statut_produit ? t("active") : t("inactive")}
              </TableCell>
              <TableCell>
                {tarif
                  ? `${(tarif.prix / 100).toFixed(2)} € / ${tarif.type_facturation}`
                  : "—"}
              </TableCell>
              <TableCell>{tarif?.stripe_price_id ?? "—"}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/products/${product.id_produit}`}>
                    {tActions("edit")}
                  </Link>
                  <DeleteProductButton
                    productId={product.id_produit}
                    productName={product.nom_pro}
                  />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
