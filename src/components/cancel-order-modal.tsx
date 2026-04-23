"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Order } from "@/lib/types";
import { formatPrice, cn } from "@/lib/utils";
import { cancelOrderAction, type CancelResult } from "@/app/kitchen/actions";

const QUICK_REASONS = [
  "Out of stock",
  "Customer left",
  "Wrong order",
  "Kitchen error",
  "Duplicate order",
  "Customer changed mind",
];

export function CancelOrderModal({
  order,
  onClose,
  onDone,
}: {
  order: Order;
  onClose: () => void;
  onDone?: (result: CancelResult) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const paidStripe =
    order.paymentStatus === "paid" && order.paymentMethod !== "cash";
  const paidCash =
    order.paymentStatus === "paid" && order.paymentMethod === "cash";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function pickChip(reason: string) {
    setSelected(reason);
    setCustom("");
    setError(null);
  }

  function submit(reasonOverride?: string) {
    const reason = (reasonOverride ?? custom.trim() ?? selected ?? "").trim();
    const chosen = reason || selected || "";
    if (!chosen) {
      setError("Pick a reason or type one");
      inputRef.current?.focus();
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await cancelOrderAction(order.id, chosen);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onDone?.(res);
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Cancel order
          </div>
          <div className="mt-1 flex items-center justify-between">
            <div className="font-display text-xl font-semibold">{order.id}</div>
            <div className="text-sm text-[var(--color-muted)]">
              Table{" "}
              <span className="text-[var(--color-gold)] font-medium">
                {order.tableNumber}
              </span>{" "}
              · {formatPrice(order.total)}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">
            Quick reason (one click)
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_REASONS.map((r) => (
              <button
                key={r}
                disabled={pending}
                onClick={() => {
                  pickChip(r);
                  submit(r);
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-50",
                  selected === r
                    ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10 text-[var(--color-gold)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-gold)]/40 hover:bg-[var(--color-surface-2)]",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">
            Or type a custom reason
          </div>
          <textarea
            ref={inputRef}
            rows={2}
            value={custom}
            placeholder="e.g. Supplier ran out of salmon"
            onChange={(e) => {
              setCustom(e.target.value);
              if (selected) setSelected(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit();
              }
            }}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm outline-none focus:border-[var(--color-gold)]"
          />
          <p className="mt-1 text-[10px] text-[var(--color-muted)]/70">
            ⌘/Ctrl + Enter to submit
          </p>
        </div>

        {paidStripe && (
          <div className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
            ⚠ Customer paid <b>{formatPrice(order.total)}</b> via {order.paymentMethod}. Cancelling will auto-refund via Stripe.
          </div>
        )}
        {paidCash && (
          <div className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
            💵 Customer paid <b>{formatPrice(order.total)}</b> in cash. Remember to hand it back at the counter.
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            disabled={pending}
            className="rounded-lg px-4 py-2 text-sm text-[var(--color-muted)] hover:text-white disabled:opacity-50"
          >
            Keep order
          </button>
          <button
            onClick={() => submit()}
            disabled={pending || (!custom.trim() && !selected)}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {pending
              ? "Cancelling…"
              : paidStripe
                ? `Cancel & refund ${formatPrice(order.total)}`
                : "Cancel order"}
          </button>
        </div>
      </div>
    </div>
  );
}
