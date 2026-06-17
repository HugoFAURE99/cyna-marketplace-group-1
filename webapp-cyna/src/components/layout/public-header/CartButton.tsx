// Cart link with an optional item-count badge.
import { ShoppingCart } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

type CartButtonProps = {
  count?: number;
};

export default async function CartButton({ count = 0 }: CartButtonProps) {
  const t = await getTranslations("header");
  const hasItems = count > 0;

  return (
    <Link
      aria-label={
        hasItems
          ? `${t("cartLabel")}, ${t("cartItems", { count })}`
          : t("cartLabel")
      }
      className="relative inline-flex size-10 items-center justify-center rounded-md text-slate-950 transition hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700"
      href="/cart"
    >
      <ShoppingCart aria-hidden="true" className="size-6" strokeWidth={2.2} />
      {hasItems && (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-purple-700 px-1.5 text-xs font-bold leading-5 text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
