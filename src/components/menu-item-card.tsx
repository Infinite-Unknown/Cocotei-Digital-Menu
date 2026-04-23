"use client";

import type { MenuItem } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function MenuItemCard({ item }: { item: MenuItem }) {
  const { add, items, setQty } = useCart();
  const qty = items.find((i) => i.itemId === item.id)?.quantity ?? 0;

  return (
    <article
      className={`group flex gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-colors hover:border-[var(--color-gold)]/40 ${!item.available ? "opacity-60" : ""}`}
    >
      <div className="relative shrink-0 w-24 h-24 overflow-hidden rounded-lg bg-[var(--color-surface-2)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
        {!item.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-semibold uppercase tracking-wide">
            Sold out
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{item.name}</h3>
            {item.nameJa && (
              <p className="text-xs text-[var(--color-muted)] truncate">{item.nameJa}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            {item.tags?.includes("signature") && <Badge tone="gold">Signature</Badge>}
            {item.tags?.includes("chef-pick") && <Badge tone="accent">Chef&apos;s pick</Badge>}
            {item.spicy && item.spicy > 0 && <Badge tone="red">{"🌶".repeat(item.spicy)}</Badge>}
          </div>
        </div>
        <p className="mt-1 text-xs text-[var(--color-muted)] line-clamp-2">{item.description}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-semibold text-[var(--color-gold)]">{formatPrice(item.price)}</span>
          {item.available && (
            qty === 0 ? (
              <Button size="sm" onClick={() => add(item.id, 1)}>
                Add
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setQty(item.id, qty - 1)}
                  aria-label="Decrease"
                >
                  −
                </Button>
                <span className="w-6 text-center font-medium">{qty}</span>
                <Button size="sm" onClick={() => setQty(item.id, qty + 1)} aria-label="Increase">
                  +
                </Button>
              </div>
            )
          )}
        </div>
      </div>
    </article>
  );
}
