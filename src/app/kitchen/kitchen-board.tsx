"use client";

import Link from "next/link";
import { useEffect, useMemo, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Order, OrderStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { timeAgo, formatTime } from "@/lib/utils";
import { advanceOrderAction } from "./actions";
import { logoutAction } from "@/app/staff/login/actions";
import { useRealtimeRefresh } from "@/lib/use-realtime";
import { CancelOrderModal } from "@/components/cancel-order-modal";

const columns: Array<{
  id: OrderStatus;
  title: string;
  tone: "blue" | "yellow" | "green" | "default";
}> = [
  { id: "confirmed", title: "New", tone: "blue" },
  { id: "preparing", title: "Preparing", tone: "yellow" },
  { id: "ready", title: "Ready", tone: "green" },
  { id: "served", title: "Served", tone: "default" },
];

const flow: OrderStatus[] = ["confirmed", "preparing", "ready", "served"];
function localNext(s: OrderStatus): OrderStatus {
  const i = flow.indexOf(s);
  if (i < 0 || i === flow.length - 1) return s;
  return flow[i + 1];
}

type Patch = { kind: "advance"; id: string; status: OrderStatus };

function apply(orders: Order[], p: Patch): Order[] {
  return orders.map((o) => (o.id === p.id ? { ...o, status: p.status } : o));
}

export function KitchenBoard({
  initial,
  supabaseConnected,
  user,
}: {
  initial: Order[];
  supabaseConnected: boolean;
  user?: { displayName: string | null; email: string | null; role: "admin" | "chef" };
}) {
  const router = useRouter();
  const [optimistic, mutate] = useOptimistic(initial, apply);
  const [, startTransition] = useTransition();
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);

  // Realtime: push-based updates when any order changes.
  useRealtimeRefresh({ channelName: "kitchen-orders", table: "orders" });

  // Safety net: low-rate polling catches any dropped events + stale sessions.
  // Runs at 60s while visible, pauses on tab hide.
  useEffect(() => {
    let t: ReturnType<typeof setInterval> | null = null;
    function onVisible() {
      if (document.hidden) {
        if (t) clearInterval(t);
        t = null;
      } else {
        if (!t) {
          router.refresh();
          t = setInterval(() => router.refresh(), 60_000);
        }
      }
    }
    onVisible();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      if (t) clearInterval(t);
    };
  }, [router]);

  const grouped = useMemo(() => {
    const map: Record<OrderStatus, Order[]> = {
      pending: [],
      confirmed: [],
      preparing: [],
      ready: [],
      served: [],
      paid: [],
      cancelled: [],
    };
    for (const o of optimistic) map[o.status]?.push(o);
    return map;
  }, [optimistic]);

  function advance(o: Order) {
    const next = localNext(o.status);
    if (next === o.status) return;
    startTransition(async () => {
      mutate({ kind: "advance", id: o.id, status: next });
      const res = await advanceOrderAction(o.id, o.status);
      if (!res.ok) console.error(res.error);
      router.refresh();
    });
  }

  function openCancel(o: Order) {
    setCancelTarget(o);
  }

  const newCount = grouped.confirmed.length;

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-background)]">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/staff" className="text-[var(--color-muted)] hover:text-white">
              ‹
            </Link>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Kitchen Display
              </div>
              <div className="font-display text-lg font-semibold">Cocotei — Live Orders</div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {newCount > 0 && (
              <Badge tone="accent" className="animate-pulse-soft">
                {newCount} new
              </Badge>
            )}
            <span className="text-[var(--color-muted)]">
              {optimistic.length} order{optimistic.length === 1 ? "" : "s"} on board
            </span>
            {supabaseConnected ? (
              <Badge tone="green" title="Realtime subscribed">
                ● Live
              </Badge>
            ) : (
              <Badge tone="yellow">● Mock</Badge>
            )}
            {user && (
              <div className="flex items-center gap-2 pl-3 border-l border-[var(--color-border)]">
                <span className="text-xs text-[var(--color-muted)]">
                  {user.displayName ?? user.email}{" "}
                  <span className="text-[10px] uppercase tracking-wider opacity-70">
                    · {user.role}
                  </span>
                </span>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-xs hover:bg-[var(--color-surface-2)]"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </header>

      {cancelTarget && (
        <CancelOrderModal
          order={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onDone={() => router.refresh()}
        />
      )}

      <div className="flex-1 overflow-x-auto">
        <div className="grid grid-cols-4 gap-4 min-w-[1100px] p-6">
          {columns.map((col) => (
            <div key={col.id} className="flex flex-col">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <Badge tone={col.tone}>{col.title}</Badge>
                  <span className="text-xs text-[var(--color-muted)]">
                    {grouped[col.id].length}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                {grouped[col.id].length === 0 && (
                  <div className="rounded-xl border border-dashed border-[var(--color-border)] p-6 text-center text-xs text-[var(--color-muted)]">
                    No orders
                  </div>
                )}
                {grouped[col.id].map((o) => (
                  <OrderCard
                    key={o.id}
                    order={o}
                    onAdvance={() => advance(o)}
                    onCancel={() => openCancel(o)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  onAdvance,
  onCancel,
}: {
  order: Order;
  onAdvance: () => void;
  onCancel: () => void;
}) {
  const actionLabel: Record<OrderStatus, string | null> = {
    pending: "Accept",
    confirmed: "Start preparing",
    preparing: "Mark ready",
    ready: "Mark served",
    served: null,
    paid: null,
    cancelled: null,
  };
  const urgency =
    Date.now() - new Date(order.createdAt).getTime() > 10 * 60_000 &&
    order.status !== "served";
  const canCancel = order.status !== "served" && order.status !== "cancelled";

  // How long in the current status (uses the per-status timestamps from the
  // DB trigger; falls back to createdAt for old rows).
  const statusStart =
    order.status === "preparing"
      ? order.preparingAt
      : order.status === "ready"
        ? order.readyAt
        : order.status === "confirmed"
          ? order.confirmedAt
          : undefined;
  const inStatusMs = statusStart
    ? Date.now() - new Date(statusStart).getTime()
    : null;
  const inStatusLabel =
    inStatusMs !== null
      ? inStatusMs < 60_000
        ? `${Math.floor(inStatusMs / 1000)}s`
        : `${Math.floor(inStatusMs / 60_000)}m`
      : null;

  return (
    <div
      className={`rounded-xl border bg-[var(--color-surface)] p-4 ${
        urgency
          ? "border-[var(--color-accent)]/60 ring-1 ring-[var(--color-accent)]/20"
          : "border-[var(--color-border)]"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">{order.id}</div>
          <div className="text-xs text-[var(--color-muted)]">
            Table <span className="text-[var(--color-gold)]">{order.tableNumber}</span>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className="text-right">
            <div className="text-xs text-[var(--color-muted)]">
              {formatTime(order.createdAt)}
            </div>
            <div
              className={`text-xs ${urgency ? "text-[var(--color-accent)]" : "text-[var(--color-muted)]"}`}
            >
              {timeAgo(order.createdAt)}
            </div>
          </div>
          {canCancel && (
            <button
              onClick={onCancel}
              title="Cancel order"
              aria-label="Cancel order"
              className="h-6 w-6 shrink-0 rounded-md text-[var(--color-muted)]/70 hover:bg-red-500/15 hover:text-red-300 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {inStatusLabel && order.status !== "served" && (
        <div className="mt-2 text-[10px] uppercase tracking-wider text-[var(--color-muted)]/70">
          ⏱ {inStatusLabel} in {order.status}
        </div>
      )}

      <ul className="mt-3 space-y-1 text-sm">
        {order.items.map((i, idx) => (
          <li key={`${i.itemId}-${idx}`} className="flex gap-2">
            <span className="font-semibold text-[var(--color-gold)] w-6">{i.quantity}×</span>
            <span className="flex-1">{i.name}</span>
          </li>
        ))}
      </ul>

      {actionLabel[order.status] && (
        <Button size="sm" className="mt-3 w-full" onClick={onAdvance}>
          {actionLabel[order.status]}
        </Button>
      )}
    </div>
  );
}
