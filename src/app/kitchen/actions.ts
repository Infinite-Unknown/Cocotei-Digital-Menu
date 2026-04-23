"use server";

import { revalidatePath } from "next/cache";
import {
  updateOrderStatus,
  nextStatus,
  cancelOrderInDb,
  getOrder,
} from "@/lib/db/orders";
import { authorizeAction } from "@/lib/auth";
import { getStripe, hasStripe } from "@/lib/stripe";
import type { OrderStatus } from "@/lib/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type CancelResult =
  | {
      ok: true;
      refunded: boolean;
      refundId?: string;
      manualRefundNeeded?: boolean;
    }
  | { ok: false; error: string };

export async function advanceOrderAction(
  id: string,
  current: OrderStatus,
): Promise<ActionResult> {
  const auth = await authorizeAction(["admin", "chef"]);
  if (!auth.ok) return auth;
  try {
    const next = nextStatus(current);
    if (next === current) return { ok: true };
    await updateOrderStatus(id, next);
    revalidatePath("/kitchen");
    revalidatePath("/admin/orders");
    revalidatePath(`/order/${id}`);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function setOrderStatusAction(
  id: string,
  status: OrderStatus,
): Promise<ActionResult> {
  const auth = await authorizeAction(["admin", "chef"]);
  if (!auth.ok) return auth;
  try {
    await updateOrderStatus(id, status);
    revalidatePath("/kitchen");
    revalidatePath("/admin/orders");
    revalidatePath(`/order/${id}`);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

/**
 * Cancel an order with a reason. If the order was paid via Stripe (non-cash)
 * and Stripe is configured, automatically issue a refund via the Stripe API.
 * If the refund fails, the order is still cancelled but flagged for manual
 * refund so the owner can handle it in the Stripe dashboard.
 */
export async function cancelOrderAction(
  id: string,
  reason: string,
): Promise<CancelResult> {
  const auth = await authorizeAction(["admin", "chef"]);
  if (!auth.ok) return { ok: false, error: auth.error };

  const cleanReason = reason.trim();
  if (!cleanReason) return { ok: false, error: "A reason is required" };
  if (cleanReason.length > 500)
    return { ok: false, error: "Reason too long (max 500 chars)" };

  try {
    const order = await getOrder(id);
    if (!order) return { ok: false, error: "Order not found" };
    if (order.status === "cancelled") {
      return { ok: true, refunded: order.paymentStatus === "refunded" };
    }

    const shouldRefund =
      order.paymentStatus === "paid" &&
      order.paymentMethod !== undefined &&
      order.paymentMethod !== "cash";

    let refundId: string | undefined;
    let refunded = false;
    let manualRefundNeeded = false;
    let finalReason = cleanReason;

    if (shouldRefund && hasStripe && order.stripePaymentIntentId) {
      try {
        const stripe = getStripe()!;
        const refund = await stripe.refunds.create({
          payment_intent: order.stripePaymentIntentId,
          reason: "requested_by_customer",
          metadata: { order_id: order.id, cancel_reason: cleanReason },
        });
        refundId = refund.id;
        refunded = refund.status === "succeeded" || refund.status === "pending";
      } catch (e) {
        manualRefundNeeded = true;
        finalReason = `[REFUND FAILED — handle manually] ${cleanReason}`;
        console.error("[cancelOrderAction] Stripe refund failed:", e);
      }
    } else if (shouldRefund) {
      // Paid Stripe order but Stripe not configured OR no payment_intent stored.
      manualRefundNeeded = true;
    }

    await cancelOrderInDb(id, { reason: finalReason, refundId, refunded });

    revalidatePath("/kitchen");
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    revalidatePath(`/order/${id}`);

    return { ok: true, refunded, refundId, manualRefundNeeded };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
