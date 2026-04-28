import { NextResponse, type NextRequest } from "next/server";
import { createOrder, type CreateOrderInput } from "@/lib/db/orders";

export const runtime = "nodejs";

/**
 * Mock TnG eWallet checkout. Mirrors the structure of /api/stripe/checkout so
 * swapping in a real integration (TnG-direct or Billplz/iPay88/Razer DuitNow
 * Online) is just changing the redirect URL + adding a webhook handler.
 *
 * Real TnG eWallet "Web Payment" flow:
 *   1. POST to TnG's /v1/payment/create with order ref + amount + return_url
 *   2. Receive a `payment_url` like https://payment.tngdigital.com.my/pay/{token}
 *   3. Redirect the customer there — they enter phone + OTP + confirm
 *   4. TnG redirects back to your return_url with status
 *   5. (Optional) listen for webhook to confirm payment server-to-server
 *
 * For now we redirect to our own mocked page that simulates that UX.
 */
function originFrom(req: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    req.headers.get("origin") ||
    `http://${req.headers.get("host") ?? "localhost:3000"}`
  );
}

export async function POST(req: NextRequest) {
  let body: CreateOrderInput;
  try {
    body = (await req.json()) as CreateOrderInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.items?.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }
  if (!body.tableNumber) {
    return NextResponse.json({ error: "Table not set" }, { status: 400 });
  }

  // Pending + unpaid until the user completes the TnG flow.
  const order = await createOrder({
    ...body,
    paymentMethod: "tng",
    initialStatus: "pending",
    paid: false,
  });

  const origin = originFrom(req);
  return NextResponse.json({
    url: `${origin}/tng/checkout/${order.id}`,
    orderId: order.id,
  });
}
