"use client";

import { useState, useMemo, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Pencil } from "lucide-react";
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
import Spinner from "@/components/ui/spinner";
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
  const [blocked, setBlocked] = useState<{ name: string; productCount: number }[]>([]);
  const [deletedCount, setDeletedCount] = useState(0);
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
    setBlocked([]);
    setDeletedCount(0);
    startTransition(async () => {
      try {
        const result = await deleteCategories([...selected]);
        const blockedDetails = result.blocked.map((item) => ({
          name:
            categories.find((category) => category.id_categorie === item.id)?.cat_nom ??
            `#${item.id}`,
          productCount: item.productCount,
        }));
        setBlocked(blockedDetails);
        setDeletedCount(result.deletedIds.length);
        setSelected(new Set([
          ...result.blocked.map((item) => item.id),
          ...result.failures.map((item) => item.id),
        ]));
        setError(result.failures.length ? tBulk("error") : null);
        if (!result.blocked.length && !result.failures.length) {
          setConfirmOpen(false);
        }
        router.refresh();
      } catch {
        setError(tBulk("error"));
      }
    });
  };

  return (
    <>
      <div className={`mb-4 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-3 transition-opacity sm:gap-3 sm:px-4 ${selected.size > 0 ? "bg-muted/50" : "opacity-40 pointer-events-none bg-muted/30"}`}>
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
              <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg sm:p-6">
                <Dialog.Title className="text-base font-semibold">
                  {tBulk("confirmTitle")}
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                  {tBulk("confirmCategories", { count: selected.size })}
                </Dialog.Description>
                {error && (
                  <p className="mt-3 text-sm text-destructive">{error}</p>
                )}
                {deletedCount > 0 && (
                  <p className="mt-3 text-sm font-medium text-green-700">
                    {tBulk("categoriesDeleted", { count: deletedCount })}
                  </p>
                )}
                {blocked.length > 0 && (
                  <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                    <p className="font-semibold">
                      {tBulk("categoriesInUse", { count: blocked.length })}
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {blocked.map((item) => (
                        <li key={item.name}>
                          {tBulk("categoryInUse", {
                            count: item.productCount,
                            name: item.name,
                          })}
                        </li>
                      ))}
                    </ul>
                  </div>
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
                    {isPending ? <><Spinner /> {tDelete("deleting")}</> : tDelete("confirm")}
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
                  <Image
                    src={category.lien_image_cat}
                    alt=""
                    className="h-10 w-10 rounded object-cover"
                    height={40}
                    unoptimized
                    width={40}
                  />
                ) : (
                  <span className="text-muted-foreground">{"—"}</span>
                )}
              </TableCell>
              <TableCell>{category.cat_nom}</TableCell>
              <TableCell>{category.cat_description ?? "—"}</TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                  <Button
                    nativeButton={false}
                    render={<Link href={`/admin/categories/${category.id_categorie}`} />}
                    size="sm"
                    variant="outline"
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    {t.edit}
                  </Button>
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
