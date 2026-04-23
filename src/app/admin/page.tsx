import Link from "next/link";
import { listOrders, listMenuItems } from "@/lib/db";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [orders, items] = await Promise.all([
    listOrders({ limit: 200 }),
    listMenuItems(),
  ]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();
  const todays = orders.filter((o) => new Date(o.createdAt).getTime() >= todayMs);

  const activeOrders = orders.filter(
    (o) =>
      o.status === "confirmed" ||
      o.status === "preparing" ||
      o.status === "ready",
  ).length;
  const revenueToday = todays.reduce((s, o) => s + o.total, 0);
  const avgTicket = todays.length ? revenueToday / todays.length : 0;
  const itemCount = items.filter((i) => i.available).length;
  const soldOut = items.filter((i) => !i.available).length;
  const recent = orders.slice(0, 8);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Welcome back — here&apos;s what&apos;s happening at Cocotei today.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Stat label="Active orders" value={activeOrders} hint="in kitchen now" tone="accent" />
        <Stat label="Revenue today" value={formatPrice(revenueToday)} hint={`${todays.length} orders`} tone="gold" />
        <Stat label="Avg ticket today" value={formatPrice(avgTicket)} hint="per order" />
        <Stat label="Menu status" value={`${itemCount} live`} hint={`${soldOut} sold out`} />
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4">
        <Link href="/kitchen" className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-gold)]/40">
          <div className="text-3xl">👨‍🍳</div>
          <div className="mt-3 font-semibold">Open Kitchen Display</div>
          <div className="text-sm text-[var(--color-muted)]">Live order queue for chefs</div>
        </Link>
        <Link href="/admin/menu" className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-gold)]/40">
          <div className="text-3xl">🍱</div>
          <div className="mt-3 font-semibold">Manage Menu</div>
          <div className="text-sm text-[var(--color-muted)]">Add, edit, hide items</div>
        </Link>
        <Link href="/admin/analytics" className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-gold)]/40">
          <div className="text-3xl">📈</div>
          <div className="mt-3 font-semibold">View Analytics</div>
          <div className="text-sm text-[var(--color-muted)]">Performance & trends</div>
        </Link>
      </div>

      <div className="mt-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="font-semibold">Recent orders</h2>
          <Link href="/admin/orders" className="text-xs text-[var(--color-muted)] hover:text-white">
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-[var(--color-muted)]">
            No orders yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-[var(--color-muted)]">
              <tr>
                <th className="px-5 py-2">Order</th>
                <th className="px-5 py-2">Table</th>
                <th className="px-5 py-2">Items</th>
                <th className="px-5 py-2">Total</th>
                <th className="px-5 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id} className="border-t border-[var(--color-border)]">
                  <td className="px-5 py-3 font-medium">{o.id}</td>
                  <td className="px-5 py-3">{o.tableNumber}</td>
                  <td className="px-5 py-3 text-[var(--color-muted)]">
                    {o.items.reduce((s, i) => s + i.quantity, 0)} items
                  </td>
                  <td className="px-5 py-3 text-[var(--color-gold)]">{formatPrice(o.total)}</td>
                  <td className="px-5 py-3 capitalize">{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
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
      <div className="text-xs uppercase tracking-wider text-[var(--color-muted)]">{label}</div>
      <div
        className={`mt-2 text-2xl font-semibold ${
          tone === "accent" ? "text-[var(--color-accent)]" : tone === "gold" ? "text-[var(--color-gold)]" : ""
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-[var(--color-muted)]">{hint}</div>
    </div>
  );
}
