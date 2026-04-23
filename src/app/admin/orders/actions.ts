"use server";

import { revalidatePath } from "next/cache";
import { markOrderPaid } from "@/lib/db/orders";
import { authorizeAction } from "@/lib/auth";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function markCashPaidAction(orderId: string): Promise<ActionResult> {
  const auth = await authorizeAction(["admin"]);
  if (!auth.ok) return auth;
  try {
    await markOrderPaid(orderId, "cash");
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    revalidatePath(`/order/${orderId}`);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
