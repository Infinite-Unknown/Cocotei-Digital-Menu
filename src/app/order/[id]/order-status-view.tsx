"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomerHeader } from "@/components/customer-header";
import { Badge } from "@/components/ui/badge";
import type { Order, OrderStatus } from "@/lib/types";
import { formatPrice, formatTime } from "@/lib/utils";
import { useRealtimeRefresh } from "@/lib/use-realtime";

const flow: OrderStatus[] = ["confirmed", "preparing", "ready", "served"];
const labels: Record<OrderStatus, string> = {
  pending: "Verifying payment…",
  confirmed: "Order received",
  preparing: "Chef is preparing",
  ready: "Ready — being served",
  served: "Served — enjoy!",
  paid: "Paid",
  cancelled: "Cancelled",
};

export function OrderStatusView({ initial }: { initial: Order }) {
  const router = useRouter();
  const search = useSearchParams();
  const order = initial;
  const justPaid = search.get("paid") === "1";

  // Realtime: push-based updates when this specific order row changes.
  useRealtimeRefresh({
    channelName: `order-${order.id}`,
    table: "orders",
    filter: `id=eq.${order.id}`,
  });

  // Safety net polling — longer cadence than before (Realtime does the heavy lifting).
  // Pending orders still check a bit faster since Stripe webhook delivery varies.
  useEffect(() => {
    if (order.status === "served" || order.status === "cancelled") return;
    const interval = order.status === "pending" ? 4000 : 30_000;
    const t = setInterval(() => router.refresh(), interval);
    return () => clearInterval(t);
  }, [router, order.status]);

  // Pending state — Stripe paid but webhook not yet processed
  if (order.status === "pending") {
    return (
      <div className="pb-20">
        <CustomerHeader showBack />
        <div className="mx-auto max-w-xl px-4 pt-12 text-center">
          <div className="text-5xl mb-4 animate-pulse-soft">⏳</div>
          <h1 className="font-display text-xl font-semibold">
            {justPaid ? "Verifying your payment…" : "Awaiting payment"}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {justPaid
              ? "This usually takes a few seconds. Your order will be sent to the kitchen as soon as Stripe confirms."
              : "We're waiting for the payment confirmation."}
          </p>
          <div className="mt-6 inline-block rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-left text-sm">
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Order</div>
            <div className="font-display text-lg font-semibold">{order.id}</div>
            <div className="mt-1 text-xs text-[var(--color-muted)]">
              Table {order.tableNumber} · {formatPrice(order.total)}
            </div>
          </div>
          <p className="mt-6 text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]/70">
            Live · realtime subscribed
          </p>
        </div>
      </div>
    );
  }

  if (order.status === "cancelled") {
    const paidStripe =
      order.paymentMethod !== undefined && order.paymentMethod !== "cash";
    const refunded = order.paymentStatus === "refunded";
    const paidByCash =
      order.paymentStatus === "paid" && order.paymentMethod === "cash";
    const wasPaid =
      order.paymentStatus === "paid" || order.paymentStatus === "refunded";
    const visibleReason = order.cancelReason
      ? order.cancelReason.replace(/^\[REFUND FAILED — handle manually\]\s*/i, "")
      : null;

    return (
      <div className="pb-20">
        <CustomerHeader showBack />
        <div className="mx-auto max-w-xl px-4 pt-12 text-center">
          <div className="text-5xl mb-4">🚫</div>
          <h1 className="font-display text-xl font-semibold">Order cancelled</h1>

          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {paidStripe && wasPaid && refunded && (
              <>
                A refund of <span className="text-[var(--color-gold)]">{formatPrice(order.total)}</span> has been issued to your {order.paymentMethod}. Allow 5–10 business days to reflect.
              </>
            )}
            {paidStripe && wasPaid && !refunded && (
              <>
                A refund of <span className="text-[var(--color-gold)]">{formatPrice(order.total)}</span> is being processed. Our team will confirm shortly.
              </>
            )}
            {paidByCash && (
              <>
                Please collect your <span className="text-[var(--color-gold)]">{formatPrice(order.total)}</span> refund at the counter.
              </>
            )}
            {!wasPaid && !paidByCash && <>Sorry about that — no charge was made.</>}
          </p>

          {visibleReason && (
            <div className="mt-6 inline-block rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-left text-sm max-w-full">
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Reason
              </div>
              <div className="mt-1 text-[var(--color-foreground)]">{visibleReason}</div>
            </div>
          )}

          <div className="mt-4 inline-block rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-left text-sm">
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Order</div>
            <div className="font-display text-lg font-semibold">{order.id}</div>
            <div className="mt-1 text-xs text-[var(--color-muted)]">
              Table {order.tableNumber}
            </div>
          </div>

          <Link
            href="/menu"
            className="mt-6 inline-block rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm text-white hover:bg-[#a30d25]"
          >
            Order again
          </Link>
        </div>
      </div>
    );
  }

  const stageIdx = Math.max(0, flow.indexOf(order.status));
  const currentStatus = flow.includes(order.status) ? order.status : "confirmed";

  return (
    <div className="pb-20">
      <CustomerHeader showBack />
      <div className="mx-auto max-w-xl px-4 pt-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Order
              </div>
              <div className="font-display text-xl font-semibold mt-1">{order.id}</div>
            </div>
            {order.paymentStatus === "paid" ? (
              <Badge tone="green">● Paid via {order.paymentMethod}</Badge>
            ) : order.paymentMethod === "cash" ? (
              <Badge tone="yellow">💵 Pay {formatPrice(order.total)} at counter</Badge>
            ) : (
              <Badge tone="yellow">● Awaiting payment</Badge>
            )}
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-[var(--color-muted)] mb-2">
              <span>Table {order.tableNumber}</span>
              <span>Placed at {formatTime(order.createdAt)}</span>
            </div>
            <Progress currentIdx={stageIdx} />
            <div className="mt-3 text-center">
              <div className="text-lg font-medium">{labels[currentStatus]}</div>
              <div className="mt-1 animate-pulse-soft text-3xl">
                {currentStatus === "confirmed" && "📝"}
                {currentStatus === "preparing" && "👨‍🍳"}
                {currentStatus === "ready" && "🛎️"}
                {currentStatus === "served" && "🎉"}
              </div>
              {order.status !== "served" && (
                <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]/70">
                  Live · realtime subscribed
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Items
          </h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {order.items.map((i, idx) => (
              <li key={`${i.itemId}-${idx}`} className="flex justify-between">
                <span>
                  <span className="text-[var(--color-muted)]">{i.quantity}×</span> {i.name}
                </span>
                <span>{formatPrice(i.priceAtOrder * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-[var(--color-border)] pt-3 flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-[var(--color-gold)]">{formatPrice(order.total)}</span>
          </div>
        </div>

        <Link
          href="/menu"
          className="mt-6 block text-center text-sm text-[var(--color-muted)] hover:text-white"
        >
          + Add more items to order
        </Link>
      </div>
    </div>
  );
}

function Progress({ currentIdx }: { currentIdx: number }) {
  return (
    <div className="flex items-center">
      {flow.map((s, i) => (
        <div key={s} className="flex-1 flex items-center">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              i <= currentIdx
                ? "bg-[var(--color-accent)] text-white"
                : "bg-[var(--color-surface-2)] text-[var(--color-muted)]"
            }`}
          >
            {i < currentIdx ? "✓" : i + 1}
          </div>
          {i < flow.length - 1 && (
            <div
              className={`flex-1 h-0.5 ${
                i < currentIdx ? "bg-[var(--color-accent)]" : "bg-[var(--color-surface-2)]"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
