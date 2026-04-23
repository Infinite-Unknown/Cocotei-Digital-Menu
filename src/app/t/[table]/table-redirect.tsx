"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-store";

export function TableRedirect({ table }: { table: string }) {
  const router = useRouter();
  const { setTable } = useCart();

  useEffect(() => {
    const pretty = table.replace(/^demo-/, "T-").toUpperCase();
    setTable(pretty);
    const t = setTimeout(() => router.replace("/menu"), 600);
    return () => clearTimeout(t);
  }, [table, router, setTable]);

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center text-center px-6">
      <div className="font-display text-4xl font-semibold">Cocotei</div>
      <div className="mt-1 text-[var(--color-gold)]">日本料理</div>
      <p className="mt-6 text-sm text-[var(--color-muted)]">Seating you at table…</p>
      <div className="mt-6 animate-pulse-soft text-3xl">🍣</div>
    </main>
  );
}
