import Link from "next/link";
import { listOrders } from "@/lib/db/orders";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

type Range = "today" | "7d" | "30d";

const RANGES: Array<{ id: Range; label: string; days: number }> = [
  { id: "today", label: "Today", days: 0 },
  { id: "7d", label: "Last 7 days", days: 7 },
  { id: "30d", label: "Last 30 days", days: 30 },
];

function startOf(range: Range): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (range === "today") return d;
  const days = RANGES.find((r) => r.id === range)?.days ?? 7;
  d.setDate(d.getDate() - (days - 1));
  return d;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await searchParams;
  const range: Range =
    sp.range === "today" || sp.range === "30d" ? sp.range : "7d";
  const rangeStart = startOf(range);
  const orders = await listOrders({ since: rangeStart, limit: 5000 });

  const stats = computeStats(orders);
  const bucketed = bucketByDay(orders, range, rangeStart);
  const peakDaily = Math.max(1, ...bucketed.map((b) => b.revenue));
  const topItems = topSellers(orders).slice(0, 8);
  const methodSplit = paymentSplit(orders);
  const hours = hourHistogram(orders);
  const peakHour = hours.reduce(
    (acc, v, i) => (v > acc.v ? { h: i, v } : acc),
    { h: 0, v: 0 },
  );

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Live from Supabase · {orders.length} order
            {orders.length === 1 ? "" : "s"} in range
          </p>
        </div>
        <div className="flex gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
          {RANGES.map((r) => (
            <Link
              key={r.id}
              href={`/admin/analytics?range=${r.id}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                range === r.id
                  ? "bg-[var(--color-accent)] text-white"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <Stat label="Revenue" value={formatPrice(stats.revenue)} hint={`${stats.paidOrders} paid`} tone="gold" />
        <Stat
          label="Orders"
          value={stats.orderCount}
          hint={`${stats.cancelledCount} cancelled · ${stats.cancellationRate}% rate`}
        />
        <Stat label="Avg ticket" value={formatPrice(stats.avgTicket)} hint="per paid order" />
        <Stat
          label="Active tables"
          value={stats.distinctTables}
          hint="distinct tables served"
        />
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <Stat
          label="Avg prep time"
          value={stats.avgPrepMin !== null ? `${stats.avgPrepMin}m` : "—"}
          hint={
            stats.prepSampleSize > 0
              ? `${stats.prepSampleSize} served · start → served`
              : "no data yet"
          }
          tone="accent"
        />
        <Stat
          label="Avg wait-to-serve"
          value={stats.avgWaitMin !== null ? `${stats.avgWaitMin}m` : "—"}
          hint="from order placed to served"
        />
        <Stat
          label="Refunded"
          value={stats.refundedCount}
          hint={formatPrice(stats.refundedAmount)}
        />
        <Stat
          label="Top reason"
          value={stats.topCancelReason ?? "—"}
          hint={
            stats.cancelledCount > 0
              ? `${stats.cancelledCount} total cancellations`
              : "no cancellations"
          }
        />
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] p-16 text-center text-[var(--color-muted)]">
          <div className="text-4xl mb-3">📉</div>
          No orders in this range yet. Try a wider window, or place a test order.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold">Revenue by day</h2>
                <span className="text-xs text-[var(--color-muted)]">
                  Peak: {formatPrice(peakDaily)}
                </span>
              </div>
              <div
                className={`flex items-end justify-between gap-2 h-40 ${bucketed.length > 14 ? "gap-1" : ""}`}
              >
                {bucketed.map((b, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-2 min-w-0"
                    title={`${b.label} — ${formatPrice(b.revenue)} · ${b.orders} orders`}
                  >
                    <div
                      className="w-full rounded-t-md bg-[var(--color-accent)]/80 min-h-[2px]"
                      style={{ height: `${(b.revenue / peakDaily) * 100}%` }}
                    />
                    <div className="text-[10px] text-[var(--color-muted)] truncate w-full text-center">
                      {b.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <h2 className="font-semibold mb-4">Top sellers</h2>
              {topItems.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">No items sold.</p>
              ) : (
                <ul className="space-y-3">
                  {topItems.slice(0, 5).map((t, idx) => (
                    <li key={t.name} className="flex items-center gap-3">
                      <span className="h-7 w-7 shrink-0 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{t.name}</div>
                        <div className="text-xs text-[var(--color-muted)]">
                          {t.qty} sold · {formatPrice(t.revenue)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <h2 className="font-semibold mb-4">Payment methods</h2>
              {methodSplit.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">No paid orders yet.</p>
              ) : (
                methodSplit.map((p) => (
                  <div key={p.label} className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{p.label}</span>
                      <span className="text-[var(--color-muted)]">
                        {p.count} · {p.pct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-gold)]"
                        style={{ width: `${p.pct}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <h2 className="font-semibold mb-4">Busiest hours</h2>
              <HourChart hours={hours} />
              <p className="mt-3 text-xs text-[var(--color-muted)]">
                {peakHour.v > 0
                  ? `Peak: ${pad(peakHour.h)}:00 — ${peakHour.v} order${peakHour.v === 1 ? "" : "s"}`
                  : "No traffic yet."}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Aggregators
// ────────────────────────────────────────────────────────────

function computeStats(orders: Order[]) {
  const paid = orders.filter((o) => o.paymentStatus === "paid");
  const refunded = orders.filter((o) => o.paymentStatus === "refunded");
  const cancelled = orders.filter((o) => o.status === "cancelled");
  const served = orders.filter((o) => o.status === "served");
  const revenue = paid.reduce((s, o) => s + o.total, 0);
  const refundedAmount = refunded.reduce((s, o) => s + o.total, 0);
  const distinctTables = new Set(orders.map((o) => o.tableNumber)).size;
  const avgTicket = paid.length > 0 ? revenue / paid.length : 0;
  const cancellationRate =
    orders.length > 0
      ? Math.round((cancelled.length / orders.length) * 100)
      : 0;

  // Prep time: preparing → served. Wait: created → served.
  const prepDurations: number[] = [];
  const waitDurations: number[] = [];
  for (const o of served) {
    if (o.preparingAt && o.servedAt) {
      prepDurations.push(
        new Date(o.servedAt).getTime() - new Date(o.preparingAt).getTime(),
      );
    }
    if (o.servedAt) {
      waitDurations.push(
        new Date(o.servedAt).getTime() - new Date(o.createdAt).getTime(),
      );
    }
  }
  const avgPrepMin =
    prepDurations.length > 0
      ? Math.round(
          prepDurations.reduce((s, v) => s + v, 0) / prepDurations.length / 60_000,
        )
      : null;
  const avgWaitMin =
    waitDurations.length > 0
      ? Math.round(
          waitDurations.reduce((s, v) => s + v, 0) / waitDurations.length / 60_000,
        )
      : null;

  // Most common cancel reason (case-insensitive match after stripping REFUND-FAILED prefix)
  const reasonCounts = new Map<string, number>();
  for (const o of cancelled) {
    const r = (o.cancelReason ?? "")
      .replace(/^\[REFUND FAILED — handle manually\]\s*/i, "")
      .trim();
    if (!r) continue;
    const key = r.toLowerCase();
    reasonCounts.set(key, (reasonCounts.get(key) ?? 0) + 1);
  }
  let topCancelReason: string | null = null;
  let topReasonCount = 0;
  for (const [k, v] of reasonCounts) {
    if (v > topReasonCount) {
      topCancelReason = k.replace(/^\w/, (c) => c.toUpperCase());
      topReasonCount = v;
    }
  }

  return {
    revenue,
    paidOrders: paid.length,
    orderCount: orders.length,
    cancelledCount: cancelled.length,
    cancellationRate,
    avgTicket,
    distinctTables,
    refundedCount: refunded.length,
    refundedAmount,
    avgPrepMin,
    avgWaitMin,
    prepSampleSize: prepDurations.length,
    topCancelReason,
  };
}

function bucketByDay(orders: Order[], range: Range, rangeStart: Date) {
  const days =
    range === "today" ? 1 : RANGES.find((r) => r.id === range)?.days ?? 7;
  const buckets = Array.from({ length: days }, (_, i) => {
    const d = new Date(rangeStart);
    d.setDate(rangeStart.getDate() + i);
    return {
      date: d,
      label:
        days <= 7
          ? d.toLocaleDateString(undefined, { weekday: "short" })
          : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`,
      revenue: 0,
      orders: 0,
    };
  });
  for (const o of orders) {
    if (o.paymentStatus !== "paid") continue;
    const oDate = new Date(o.createdAt);
    oDate.setHours(0, 0, 0, 0);
    const idx = Math.floor(
      (oDate.getTime() - rangeStart.getTime()) / (24 * 60 * 60 * 1000),
    );
    if (idx >= 0 && idx < buckets.length) {
      buckets[idx].revenue += o.total;
      buckets[idx].orders += 1;
    }
  }
  return buckets;
}

function topSellers(orders: Order[]) {
  const totals = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    for (const i of o.items) {
      const key = i.itemId || i.name;
      const existing = totals.get(key);
      const revenue = i.quantity * i.priceAtOrder;
      if (existing) {
        existing.qty += i.quantity;
        existing.revenue += revenue;
      } else {
        totals.set(key, { name: i.name, qty: i.quantity, revenue });
      }
    }
  }
  return [...totals.values()].sort((a, b) => b.qty - a.qty);
}

function paymentSplit(orders: Order[]) {
  const counts = new Map<string, number>();
  let total = 0;
  for (const o of orders) {
    if (o.paymentStatus !== "paid") continue;
    const label = o.paymentMethod ?? "other";
    counts.set(label, (counts.get(label) ?? 0) + 1);
    total += 1;
  }
  if (total === 0) return [];
  return [...counts.entries()]
    .map(([label, count]) => ({
      label,
      count,
      pct: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

function hourHistogram(orders: Order[]) {
  const hours = new Array(24).fill(0);
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    hours[new Date(o.createdAt).getHours()]++;
  }
  return hours;
}

// ────────────────────────────────────────────────────────────
// Bits
// ────────────────────────────────────────────────────────────

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint: string;
  tone?: "accent" | "gold";
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </div>
      <div
        className={`mt-2 text-2xl font-semibold ${
          tone === "accent"
            ? "text-[var(--color-accent)]"
            : tone === "gold"
              ? "text-[var(--color-gold)]"
              : ""
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-[var(--color-muted)]">{hint}</div>
    </div>
  );
}

function HourChart({ hours }: { hours: number[] }) {
  // Show 10 AM – 11 PM (typical ops window). Can widen later.
  const window = hours.slice(10, 23);
  const peak = Math.max(1, ...window);
  return (
    <div className="grid grid-cols-[repeat(13,1fr)] gap-1 items-end h-32">
      {window.map((v, i) => (
        <div key={i} className="flex flex-col items-center gap-1 min-w-0">
          <div
            className="w-full rounded-sm bg-[var(--color-accent)]/70 min-h-[2px]"
            style={{ height: `${(v / peak) * 100}%` }}
            title={`${pad(10 + i)}:00 — ${v} order${v === 1 ? "" : "s"}`}
          />
          <div className="text-[10px] text-[var(--color-muted)]">
            {pad(10 + i)}
          </div>
        </div>
      ))}
    </div>
  );
}
