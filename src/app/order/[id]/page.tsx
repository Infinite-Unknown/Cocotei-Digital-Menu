import Link from "next/link";
import { getOrder } from "@/lib/db/orders";
import { CustomerHeader } from "@/components/customer-header";
import { OrderStatusView } from "./order-status-view";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) {
    return (
      <div>
        <CustomerHeader showBack />
        <div className="mx-auto max-w-xl px-4 pt-12 text-center">
          <div className="text-4xl mb-3">🤔</div>
          <h1 className="text-xl font-semibold">Order not found</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            We couldn&apos;t find order <span className="font-mono">{id}</span>.
          </p>
          <Link
            href="/menu"
            className="mt-6 inline-block rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm text-white hover:bg-[#a30d25]"
          >
            Back to menu
          </Link>
        </div>
      </div>
    );
  }

  return <OrderStatusView initial={order} />;
}
