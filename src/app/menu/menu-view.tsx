"use client";

import { useMemo, useState } from "react";
import type { Category, MenuItem } from "@/lib/types";
import { CustomerHeader } from "@/components/customer-header";
import { CategoryTabs } from "@/components/category-tabs";
import { MenuItemCard } from "@/components/menu-item-card";
import { CartBar } from "@/components/cart-bar";

export function MenuView({
  categories,
  items,
}: {
  categories: Category[];
  items: MenuItem[];
}) {
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (activeCat && i.categoryId !== activeCat) return false;
      if (!q) return true;
      return (
        i.name.toLowerCase().includes(q) ||
        i.nameJa?.includes(query) ||
        i.description.toLowerCase().includes(q)
      );
    });
  }, [items, activeCat, query]);

  const grouped = useMemo(() => {
    if (activeCat) return [{ category: categories.find((c) => c.id === activeCat)!, items: filtered }];
    return categories
      .map((c) => ({ category: c, items: filtered.filter((i) => i.categoryId === c.id) }))
      .filter((g) => g.items.length > 0);
  }, [filtered, activeCat, categories]);

  return (
    <div className="pb-28">
      <CustomerHeader />
      <div className="mx-auto max-w-xl px-4 pt-4">
        <div className="mb-4">
          <h1 className="font-display text-2xl font-semibold">Menu</h1>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            All prices in RM. Subject to 10% service &amp; 6% SST.
          </p>
        </div>

        <div className="mb-3">
          <input
            type="text"
            placeholder="Search dishes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-gold)]/60"
          />
        </div>

        <CategoryTabs categories={categories} active={activeCat} onChange={setActiveCat} />

        <div className="mt-4 space-y-6">
          {grouped.map(({ category, items }) => (
            <section key={category.id}>
              <h2 className="mb-2 flex items-baseline gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                <span>{category.icon}</span>
                <span>{category.name}</span>
                <span className="text-[var(--color-gold)]/70 text-xs normal-case tracking-normal">
                  {category.nameJa}
                </span>
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {items.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
          {grouped.length === 0 && (
            <div className="py-12 text-center text-[var(--color-muted)]">
              No dishes match your search.
            </div>
          )}
        </div>
      </div>
      <CartBar />
    </div>
  );
}
