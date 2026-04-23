"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "./types";

type CartCtx = {
  items: CartItem[];
  tableNumber: string | null;
  add: (itemId: string, qty?: number) => void;
  remove: (itemId: string) => void;
  setQty: (itemId: string, qty: number) => void;
  clear: () => void;
  setTable: (t: string) => void;
  totalCount: number;
};

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = "cocotei_cart_v1";
const TABLE_KEY = "cocotei_table_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
      const t = localStorage.getItem(TABLE_KEY);
      if (t) setTableNumber(t);
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (tableNumber) localStorage.setItem(TABLE_KEY, tableNumber);
  }, [tableNumber, hydrated]);

  const api = useMemo<CartCtx>(
    () => ({
      items,
      tableNumber,
      add: (itemId, qty = 1) =>
        setItems((prev) => {
          const existing = prev.find((i) => i.itemId === itemId);
          if (existing) {
            return prev.map((i) =>
              i.itemId === itemId ? { ...i, quantity: i.quantity + qty } : i,
            );
          }
          return [...prev, { itemId, quantity: qty }];
        }),
      remove: (itemId) =>
        setItems((prev) => prev.filter((i) => i.itemId !== itemId)),
      setQty: (itemId, qty) =>
        setItems((prev) =>
          qty <= 0
            ? prev.filter((i) => i.itemId !== itemId)
            : prev.map((i) =>
                i.itemId === itemId ? { ...i, quantity: qty } : i,
              ),
        ),
      clear: () => setItems([]),
      setTable: (t) => setTableNumber(t),
      totalCount: items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    [items, tableNumber],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
