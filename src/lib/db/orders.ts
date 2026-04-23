import { getServerClient, hasSupabase } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/lib/types";
import { mockOrders } from "@/lib/mock-data";
import type { Database } from "@/lib/supabase/database.types";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
type OrderRowWithItems = OrderRow & { order_items: OrderItemRow[] };

function rowToOrder(row: OrderRow, items: OrderItemRow[]): Order {
  return {
    id: row.id,
    tableNumber: row.table_number,
    items: items.map((i) => ({
      itemId: i.menu_item_id ?? "",
      name: i.name,
      quantity: i.quantity,
      priceAtOrder: Number(i.price_at_order),
      notes: i.notes ?? undefined,
    })),
    subtotal: Number(row.subtotal),
    serviceCharge: Number(row.service_charge),
    tax: Number(row.tax),
    total: Number(row.total),
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method ?? undefined,
    cancelReason: row.cancel_reason ?? undefined,
    stripePaymentIntentId: row.stripe_payment_intent_id ?? undefined,
    stripeRefundId: row.stripe_refund_id ?? undefined,
    confirmedAt: row.confirmed_at ?? undefined,
    preparingAt: row.preparing_at ?? undefined,
    readyAt: row.ready_at ?? undefined,
    servedAt: row.served_at ?? undefined,
    cancelledAt: row.cancelled_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listOrders(opts?: {
  statuses?: OrderStatus[];
  limit?: number;
  since?: Date;
}): Promise<Order[]> {
  if (!hasSupabase) {
    let r = mockOrders;
    if (opts?.statuses) r = r.filter((o) => opts.statuses!.includes(o.status));
    if (opts?.since) {
      const ms = opts.since.getTime();
      r = r.filter((o) => new Date(o.createdAt).getTime() >= ms);
    }
    if (opts?.limit) r = r.slice(0, opts.limit);
    return r;
  }
  const db = getServerClient();
  if (!db) return mockOrders;

  let q = db
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });
  if (opts?.statuses) q = q.in("status", opts.statuses);
  if (opts?.since) q = q.gte("created_at", opts.since.toISOString());
  if (opts?.limit) q = q.limit(opts.limit);

  const { data, error } = await q;
  if (error || !data) {
    console.error("[db.listOrders]", error);
    return mockOrders;
  }
  return (data as OrderRowWithItems[]).map((row) =>
    rowToOrder(row, row.order_items ?? []),
  );
}

export async function getOrder(id: string): Promise<Order | null> {
  if (!hasSupabase) {
    return mockOrders.find((o) => o.id === id) ?? null;
  }
  const db = getServerClient();
  if (!db) return null;
  const { data, error } = await db
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[db.getOrder]", error);
    return null;
  }
  if (!data) return null;
  const row = data as OrderRowWithItems;
  return rowToOrder(row, row.order_items ?? []);
}

export type CreateOrderInput = {
  tableNumber: string;
  items: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    priceAtOrder: number;
    notes?: string;
  }>;
  subtotal: number;
  serviceCharge: number;
  tax: number;
  total: number;
  paymentMethod?: NonNullable<Order["paymentMethod"]>;
  /** "confirmed" (default) sends to kitchen immediately; "pending" waits for payment confirmation. */
  initialStatus?: "pending" | "confirmed";
  /** Whether payment is already settled. Defaults: cash → unpaid, mock-mode → paid. */
  paid?: boolean;
};

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const id = generateOrderId();
  const now = new Date().toISOString();
  const status = input.initialStatus ?? "confirmed";
  const paymentStatus: Order["paymentStatus"] =
    input.paid === true
      ? "paid"
      : input.paid === false
        ? "unpaid"
        : input.paymentMethod && input.paymentMethod !== "cash"
          ? "paid"
          : "unpaid";

  if (!hasSupabase) {
    return {
      id,
      tableNumber: input.tableNumber,
      items: input.items.map((i) => ({
        itemId: i.menuItemId,
        name: i.name,
        quantity: i.quantity,
        priceAtOrder: i.priceAtOrder,
      })),
      subtotal: input.subtotal,
      serviceCharge: input.serviceCharge,
      tax: input.tax,
      total: input.total,
      status,
      paymentStatus,
      paymentMethod: input.paymentMethod,
      createdAt: now,
      updatedAt: now,
    };
  }

  const db = getServerClient();
  if (!db) throw new Error("Supabase not configured");

  const { error: orderErr } = await db.from("orders").insert({
    id,
    table_number: input.tableNumber,
    subtotal: input.subtotal,
    service_charge: input.serviceCharge,
    tax: input.tax,
    total: input.total,
    status,
    payment_status: paymentStatus,
    payment_method: input.paymentMethod ?? null,
  });
  if (orderErr) throw new Error(`order insert: ${orderErr.message}`);

  if (input.items.length > 0) {
    const { error: itemsErr } = await db.from("order_items").insert(
      input.items.map((i) => ({
        order_id: id,
        menu_item_id: i.menuItemId || null,
        name: i.name,
        quantity: i.quantity,
        price_at_order: i.priceAtOrder,
        notes: i.notes ?? null,
      })),
    );
    if (itemsErr) throw new Error(`order_items insert: ${itemsErr.message}`);
  }

  const created = await getOrder(id);
  if (!created) throw new Error("Failed to read created order");
  return created;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<void> {
  if (!hasSupabase) return;
  const db = getServerClient();
  if (!db) throw new Error("Supabase not configured");
  const { error } = await db.from("orders").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function markOrderPaid(
  id: string,
  paymentMethod?: NonNullable<Order["paymentMethod"]>,
  stripePaymentIntentId?: string,
): Promise<void> {
  if (!hasSupabase) return;
  const db = getServerClient();
  if (!db) throw new Error("Supabase not configured");
  const patch: {
    payment_status: "paid";
    status: OrderStatus;
    payment_method?: NonNullable<Order["paymentMethod"]>;
    stripe_payment_intent_id?: string;
  } = {
    payment_status: "paid",
    status: "confirmed", // bumps pending orders into the kitchen queue on payment
  };
  if (paymentMethod) patch.payment_method = paymentMethod;
  if (stripePaymentIntentId) patch.stripe_payment_intent_id = stripePaymentIntentId;
  const { error } = await db.from("orders").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function cancelOrderInDb(
  id: string,
  opts: { reason: string; refundId?: string; refunded?: boolean },
): Promise<void> {
  if (!hasSupabase) return;
  const db = getServerClient();
  if (!db) throw new Error("Supabase not configured");
  const patch: {
    status: "cancelled";
    cancel_reason: string;
    stripe_refund_id?: string;
    payment_status?: "refunded";
  } = {
    status: "cancelled",
    cancel_reason: opts.reason,
  };
  if (opts.refundId) patch.stripe_refund_id = opts.refundId;
  if (opts.refunded) patch.payment_status = "refunded";
  const { error } = await db.from("orders").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

function generateOrderId() {
  // ORD-XXXXXX, base36 of timestamp tail — short, sortable-ish, low collision at restaurant scale
  const tail = Date.now().toString(36).slice(-5).toUpperCase();
  const rand = Math.floor(Math.random() * 36).toString(36).toUpperCase();
  return `ORD-${tail}${rand}`;
}

const flow: OrderStatus[] = ["confirmed", "preparing", "ready", "served"];

export function nextStatus(s: OrderStatus): OrderStatus {
  const i = flow.indexOf(s);
  if (i < 0 || i === flow.length - 1) return s;
  return flow[i + 1];
}
