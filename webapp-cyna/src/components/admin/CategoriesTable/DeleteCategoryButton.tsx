"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteCategory } from "@/app/(admin)/admin/_actions/category.actions";
import { Dialog } from "@base-ui/react/dialog";

type DeleteCategoryButtonProps = {
  categoryId: number;
  categoryName: string;
};

export default function DeleteCategoryButton({
  categoryId,
  categoryName,
}: DeleteCategoryButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onDelete = () => {
    setError(null);
    startTransition(async () => {
      try {
        await deleteCategory(categoryId);
        setOpen(false);
        router.refresh();
      } catch {
        setError(
          "Impossible de supprimer cette catégorie. Elle est peut-être utilisée par des produits.",
        );
      }
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger render={<Button variant="destructive" size="sm" />}>
        Supprimer
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/20 supports-backdrop-filter:backdrop-blur-xs" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-popover p-6 text-popover-foreground shadow-lg">
          <Dialog.Title className="text-base font-semibold">
            Confirmer la suppression
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            Supprimer la catégorie &quot;{categoryName}&quot; ? Cette action est
            définitive.
          </Dialog.Description>

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close render={<Button variant="outline" size="sm" />}>
              Annuler
            </Dialog.Close>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={isPending}
            >
              {isPending ? "Suppression..." : "Confirmer"}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
