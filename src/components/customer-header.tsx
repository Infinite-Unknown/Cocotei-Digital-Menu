"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-store";

export function CustomerHeader({ showBack = false }: { showBack?: boolean }) {
  const { tableNumber } = useCart();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-background)]/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
        <Link href="/menu" className="flex items-center gap-2">
          {showBack && <span className="text-xl">‹</span>}
          <div>
            <div className="font-display text-base font-semibold tracking-wide">
              Cocotei
            </div>
            <div className="-mt-0.5 text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
              日本料理
            </div>
          </div>
        </Link>
        {tableNumber && (
          <div className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs">
            Table <span className="font-semibold text-[var(--color-gold)]">{tableNumber}</span>
          </div>
        )}
      </div>
    </header>
  );
}
