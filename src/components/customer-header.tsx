"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart-store";

export function CustomerHeader({ showBack = false }: { showBack?: boolean }) {
  const { tableNumber, recentOrderId } = useCart();
  const pathname = usePathname() ?? "";
  const onOrderPage = pathname.startsWith("/order/");

  return (
    <div className="sticky top-0 z-30">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-background)]/90 backdrop-blur">
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
              Table{" "}
              <span className="font-semibold text-[var(--color-gold)]">
                {tableNumber}
              </span>
            </div>
          )}
        </div>
      </header>

      {recentOrderId && !onOrderPage && (
        <Link
          href={`/order/${recentOrderId}`}
          className="block border-b border-[var(--color-accent)]/30 bg-[var(--color-accent)]/15 backdrop-blur transition-colors hover:bg-[var(--color-accent)]/25"
        >
          <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-2 text-sm">
            <span className="flex items-center gap-2">
              <span className="animate-pulse-soft">🛎️</span>
              <span>
                Track your order{" "}
                <span className="font-mono text-[var(--color-gold)]">
                  {recentOrderId}
                </span>
              </span>
            </span>
            <span className="text-xs text-[var(--color-muted)]">View →</span>
          </div>
        </Link>
      )}
    </div>
  );
}
