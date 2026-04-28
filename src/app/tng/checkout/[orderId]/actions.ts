"use server";

import { revalidatePath } from "next/cache";
import { markOrderPaid, getOrder } from "@/lib/db/orders";

export type TngResult = { ok: true } | { ok: false; error: string };

/**
 * Mock TnG payment confirmation. In a real integration this would be triggered
 * by TnG's redirect-back to a `return_url` AND a server-to-server webhook to
 * verify the payment. Here we trust the client because it's the demo flow.
 */
export async function confirmTngPaymentAction(
  orderId: string,
): Promise<TngResult> {
  try {
    const order = await getOrder(orderId);
    if (!order) return { ok: false, error: "Order not found" };
    if (order.paymentStatus === "paid") return { ok: true };
    await markOrderPaid(orderId, "tng");
    revalidatePath(`/order/${orderId}`);
    revalidatePath("/kitchen");
    revalidatePath("/admin/orders");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
