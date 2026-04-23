"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { getItemById } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";

export function CartBar() {
  const { items } = useCart();
  if (items.length === 0) return null;

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => {
    const menu = getItemById(i.itemId);
    return s + (menu ? menu.price * i.quantity : 0);
  }, 0);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 pt-2 pointer-events-none">
      <Link
        href="/cart"
        className="pointer-events-auto mx-auto flex max-w-xl items-center justify-between rounded-xl bg-[var(--color-accent)] px-4 py-3 text-white shadow-2xl transition-colors hover:bg-[#a30d25]"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
            {count}
          </span>
          <span className="font-medium">View cart</span>
        </span>
        <span className="font-semibold">{formatPrice(subtotal)}</span>
      </Link>
    </div>
  );
}
