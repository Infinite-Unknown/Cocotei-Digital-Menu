import { listOrders } from "@/lib/db/orders";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatTime } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";
import { MarkPaidButton } from "./mark-paid-button";
import { CancelButton } from "./cancel-button";

export const dynamic = "force-dynamic";

const toneByStatus: Record<
  OrderStatus,
  "accent" | "yellow" | "green" | "blue" | "default" | "red"
> = {
  pending: "default",
  confirmed: "blue",
  preparing: "yellow",
  ready: "green",
  served: "default",
  paid: "green",
  cancelled: "red",
};

export default async function AdminOrdersPage() {
  const orders = await listOrders({ limit: 200 });
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const unpaidCash = orders.filter(
    (o) => o.paymentMethod === "cash" && o.paymentStatus === "unpaid",
  ).length;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          {orders.length} order{orders.length === 1 ? "" : "s"} ·{" "}
          {formatPrice(totalRevenue)} gross
          {unpaidCash > 0 && (
            <>
              {" · "}
              <span className="text-yellow-300">
                {unpaidCash} unpaid cash
              </span>
            </>
          )}
        </p>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-[var(--color-muted)] bg-[var(--color-surface-2)]">
            <tr>
              <th className="px-5 py-3">Order</th>
              <th className="px-5 py-3">Placed</th>
              <th className="px-5 py-3">Table</th>
              <th className="px-5 py-3">Items</th>
              <th className="px-5 py-3">Payment</th>
              <th className="px-5 py-3">Total</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-12 text-center text-[var(--color-muted)]"
                >
                  No orders yet — place one from the customer flow to see it here.
                </td>
              </tr>
            )}
            {orders.map((o) => {
              const cashUnpaid =
                o.paymentMethod === "cash" && o.paymentStatus === "unpaid";
              const canCancel = o.status !== "served" && o.status !== "cancelled";
              return (
                <tr key={o.id} className="border-t border-[var(--color-border)]">
                  <td className="px-5 py-3 font-medium">{o.id}</td>
                  <td className="px-5 py-3 text-[var(--color-muted)]">
                    {formatTime(o.createdAt)}
                  </td>
                  <td className="px-5 py-3">{o.tableNumber}</td>
                  <td className="px-5 py-3 text-[var(--color-muted)]">
                    <span className="line-clamp-1 max-w-xs">
                      {o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                    </span>
                  </td>
                  <td className="px-5 py-3 capitalize">
                    <span className="flex items-center gap-2">
                      {o.paymentMethod ?? "—"}
                      {o.paymentStatus === "paid" && (
                        <span className="text-[10px] text-green-400">● paid</span>
                      )}
                      {o.paymentStatus === "unpaid" && (
                        <span className="text-[10px] text-yellow-400">● unpaid</span>
                      )}
                      {o.paymentStatus === "refunded" && (
                        <span
                          className="text-[10px] text-blue-300"
                          title={o.stripeRefundId ?? "Refunded"}
                        >
                          ↩ refunded
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[var(--color-gold)]">
                    {formatPrice(o.total)}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={toneByStatus[o.status]}>{o.status}</Badge>
                    {o.status === "cancelled" && o.cancelReason && (
                      <div
                        className="mt-1 text-[10px] text-[var(--color-muted)] line-clamp-1 max-w-[220px]"
                        title={o.cancelReason}
                      >
                        🗒 {o.cancelReason}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex gap-1.5">
                      {cashUnpaid && <MarkPaidButton orderId={o.id} />}
                      {canCancel && <CancelButton order={o} />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
