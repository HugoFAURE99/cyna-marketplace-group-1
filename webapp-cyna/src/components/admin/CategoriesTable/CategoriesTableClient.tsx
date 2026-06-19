"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@base-ui/react/dialog";
import type { getCategories } from "@/app/[locale]/(admin)/admin/_actions/category.actions";
import { deleteCategories } from "@/app/[locale]/(admin)/admin/_actions/category.actions";
import DeleteCategoryButton from "@/components/admin/CategoriesTable/DeleteCategoryButton";

type Category = Awaited<ReturnType<typeof getCategories>>[number];

type SortDirection = "asc" | "desc" | null;
type SortKey = "name" | "description";

interface Translations {
  image: string;
  name: string;
  description: string;
  actions: string;
  edit: string;
}

function SortableHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  return (
    <TableHead className="cursor-pointer select-none" onClick={onClick}>
      <div className="flex items-center gap-1">
        {label}
        <span className="text-xs">
          {active && direction === "asc"
            ? "▲"
            : active && direction === "desc"
              ? "▼"
              : "⇅"}
        </span>
      </div>
    </TableHead>
  );
}

export default function CategoriesTableClient({
  categories,
  translations,
}: {
  categories: Category[];
  translations: Translations;
}) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const tBulk = useTranslations("admin.bulk");
  const tDelete = useTranslations("admin.delete");

  const handleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
      setSortDir(null);
    }
  };

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return categories;

    return [...categories].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.cat_nom.localeCompare(b.cat_nom);
          break;
        case "description":
          cmp = (a.cat_description ?? "").localeCompare(
            b.cat_description ?? "",
          );
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [categories, sortKey, sortDir]);

  const t = translations;

  const allIds = categories.map((c) => c.id_categorie);
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selected.has(id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  };

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    setError(null);
    startTransition(async () => {
      try {
        await deleteCategories([...selected]);
        setSelected(new Set());
        setConfirmOpen(false);
        router.refresh();
      } catch {
        setError(tBulk("error"));
      }
    });
  };

  return (
    <>
      <div className={`mb-4 flex items-center gap-3 rounded-lg border px-4 py-2 transition-opacity ${selected.size > 0 ? "bg-muted/50" : "opacity-40 pointer-events-none bg-muted/30"}`}>
          <span className="text-sm font-medium">
            {tBulk("selected", { count: selected.size })}
          </span>

          <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
            <Dialog.Trigger
              render={
                <Button variant="destructive" size="sm" disabled={isPending || selected.size === 0} />
              }
            >
              {tBulk("deleteSelected")}
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/20 supports-backdrop-filter:backdrop-blur-xs" />
              <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-popover p-6 text-popover-foreground shadow-lg">
                <Dialog.Title className="text-base font-semibold">
                  {tBulk("confirmTitle")}
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                  {tBulk("confirmCategories", { count: selected.size })}
                </Dialog.Description>
                {error && (
                  <p className="mt-3 text-sm text-destructive">{error}</p>
                )}
                <div className="mt-5 flex justify-end gap-2">
                  <Dialog.Close
                    render={<Button variant="outline" size="sm" />}
                  >
                    {tDelete("cancel")}
                  </Dialog.Close>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={isPending}
                  >
                    {isPending ? tDelete("deleting") : tDelete("confirm")}
                  </Button>
                </div>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>

          {error && !confirmOpen && (
            <span className="text-sm text-destructive">{error}</span>
          )}
        </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-gray-300"
              />
            </TableHead>
            <TableHead>{t.image}</TableHead>
            <SortableHeader
              label={t.name}
              active={sortKey === "name"}
              direction={sortDir}
              onClick={() => handleSort("name")}
            />
            <SortableHeader
              label={t.description}
              active={sortKey === "description"}
              direction={sortDir}
              onClick={() => handleSort("description")}
            />
            <TableHead>{t.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((category, index) => (
            <TableRow
              key={category.id_categorie}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${selected.has(category.id_categorie) ? "bg-muted/40" : index % 2 === 1 ? "bg-muted/20" : ""}`}
              onClick={() => router.push(`/admin/categories/${category.id_categorie}/detail`)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selected.has(category.id_categorie)}
                  onChange={() => toggleOne(category.id_categorie)}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </TableCell>
              <TableCell>
                {category.lien_image_cat ? (
                  <img
                    src={category.lien_image_cat}
                    alt=""
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <span className="text-muted-foreground">{"—"}</span>
                )}
              </TableCell>
              <TableCell>{category.cat_nom}</TableCell>
              <TableCell>{category.cat_description ?? "—"}</TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/categories/${category.id_categorie}`}>
                    {t.edit}
                  </Link>
                  <DeleteCategoryButton
                    categoryId={category.id_categorie}
                    categoryName={category.cat_nom}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
