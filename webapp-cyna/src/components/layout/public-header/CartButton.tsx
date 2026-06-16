// Cart link with an optional item-count badge.
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

type CartButtonProps = {
  count?: number;
};

export default function CartButton({ count = 0 }: CartButtonProps) {
  const hasItems = count > 0;

  return (
    <Link
      aria-label={hasItems ? `Cart, ${count} items` : "Cart"}
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
