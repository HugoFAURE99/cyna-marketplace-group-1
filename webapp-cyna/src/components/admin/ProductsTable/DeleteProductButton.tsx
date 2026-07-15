"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { deleteProduct } from "@/app/[locale]/(admin)/admin/_actions/product.actions";
import { Dialog } from "@base-ui/react/dialog";

type DeleteProductButtonProps = {
  productId: number;
  productName: string;
};

export default function DeleteProductButton({
  productId,
  productName,
}: DeleteProductButtonProps) {
  const t = useTranslations("admin.delete");
  const tActions = useTranslations("admin.actions");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onDelete = () => {
    setError(null);
    startTransition(async () => {
      try {
        await deleteProduct(productId);
        setOpen(false);
        router.refresh();
      } catch {
        setError(t("productError"));
      }
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger render={<Button variant="destructive" size="sm" />}>
        {tActions("delete")}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/20 supports-backdrop-filter:backdrop-blur-xs" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg sm:p-6">
          <Dialog.Title className="text-base font-semibold">
            {t("title")}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            {t("productMessage", { name: productName })}
          </Dialog.Description>

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close render={<Button variant="outline" size="sm" />}>
              {t("cancel")}
            </Dialog.Close>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={isPending}
            >
              {isPending ? <><Spinner /> {t("deleting")}</> : t("confirm")}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
