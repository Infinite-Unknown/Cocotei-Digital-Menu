"use server";

import { revalidatePath } from "next/cache";
import { createOrder, type CreateOrderInput } from "@/lib/db/orders";

export type CreateOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

export async function createOrderAction(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  try {
    if (!input.items.length) return { ok: false, error: "Cart is empty" };
    if (!input.tableNumber) return { ok: false, error: "Table not set" };

    const order = await createOrder(input);
    revalidatePath("/kitchen");
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return { ok: true, orderId: order.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
