import Link from "next/link";
import { getOrder } from "@/lib/db/orders";
import { TngCheckoutForm } from "./tng-form";

export const dynamic = "force-dynamic";

export default async function TngCheckoutPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getOrder(orderId);

  if (!order) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center bg-[#003E7E] p-6 text-center text-white">
        <div className="text-5xl mb-4">🤔</div>
        <h1 className="text-xl font-semibold">Session expired</h1>
        <p className="mt-2 text-sm text-white/70">
          We couldn&apos;t find this payment session.
        </p>
        <Link
          href="/menu"
          className="mt-6 inline-block rounded-xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-[#003E7E]"
        >
          Back to menu
        </Link>
      </main>
    );
  }

  if (order.paymentStatus === "paid") {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center bg-[#003E7E] p-6 text-center text-white">
        <div className="text-5xl mb-4">✓</div>
        <h1 className="text-xl font-semibold">Already paid</h1>
        <p className="mt-2 text-sm text-white/70">
          This order has already been settled.
        </p>
        <Link
          href={`/order/${order.id}`}
          className="mt-6 inline-block rounded-xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-[#003E7E]"
        >
          View order
        </Link>
      </main>
    );
  }

  return <TngCheckoutForm order={order} />;
}
