"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleProductStatus } from "@/app/[locale]/(admin)/admin/_actions/product.actions";

export default function ToggleStatusButton({
  productId,
  active,
}: {
  productId: number;
  active: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const toggle = () => {
    startTransition(async () => {
      await toggleProductStatus(productId, !active);
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
        active ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          active ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}
