"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CustomerHeader } from "@/components/customer-header";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-store";
import { getItemById } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const { items, setQty, remove, clear } = useCart();

  const rows = useMemo(
    () =>
      items
        .map((i) => {
          const m = getItemById(i.itemId);
          if (!m) return null;
          return { menu: m, qty: i.quantity, lineTotal: m.price * i.quantity };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null),
    [items],
  );

  const subtotal = rows.reduce((s, r) => s + r.lineTotal, 0);
  const service = +(subtotal * 0.1).toFixed(2);
  const tax = +((subtotal + service) * 0.06).toFixed(2);
  const total = +(subtotal + service + tax).toFixed(2);

  return (
    <div className="pb-28">
      <CustomerHeader showBack />
      <div className="mx-auto max-w-xl px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl font-semibold">Your cart</h1>
          {rows.length > 0 && (
            <button
              onClick={clear}
              className="text-xs text-[var(--color-muted)] hover:text-white"
            >
              Clear all
            </button>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] p-10 text-center">
            <div className="text-5xl mb-3">🍜</div>
            <p className="text-[var(--color-muted)]">Your cart is empty.</p>
            <Link
              href="/menu"
              className="mt-4 inline-block rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm text-white hover:bg-[#a30d25]"
            >
              Browse menu
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {rows.map(({ menu, qty, lineTotal }) => (
                <div
                  key={menu.id}
                  className="flex gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={menu.image}
                    alt=""
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{menu.name}</div>
                        <div className="text-xs text-[var(--color-muted)]">
                          {formatPrice(menu.price)} each
                        </div>
                      </div>
                      <button
                        onClick={() => remove(menu.id)}
                        className="text-xs text-[var(--color-muted)] hover:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setQty(menu.id, qty - 1)}
                        >
                          −
                        </Button>
                        <span className="w-6 text-center font-medium">{qty}</span>
                        <Button size="sm" onClick={() => setQty(menu.id, qty + 1)}>
                          +
                        </Button>
                      </div>
                      <div className="font-semibold text-[var(--color-gold)]">
                        {formatPrice(lineTotal)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm">
              <Row label="Subtotal" value={formatPrice(subtotal)} />
              <Row label="Service charge (10%)" value={formatPrice(service)} />
              <Row label="SST (6%)" value={formatPrice(tax)} />
              <div className="border-t border-[var(--color-border)] pt-2 mt-2">
                <Row label="Total" value={formatPrice(total)} bold />
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-6 block rounded-xl bg-[var(--color-accent)] py-4 text-center font-semibold text-white hover:bg-[#a30d25]"
            >
              Continue to checkout — {formatPrice(total)}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-semibold text-base" : ""}`}>
      <span className={bold ? "" : "text-[var(--color-muted)]"}>{label}</span>
      <span className={bold ? "text-[var(--color-gold)]" : ""}>{value}</span>
    </div>
  );
}
