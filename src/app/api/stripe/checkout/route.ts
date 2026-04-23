import { NextResponse, type NextRequest } from "next/server";
import { getStripe, hasStripe, STRIPE_CURRENCY, stripePaymentMethods } from "@/lib/stripe";
import { createOrder, type CreateOrderInput } from "@/lib/db/orders";

export const runtime = "nodejs";

type Body = CreateOrderInput;

function originFrom(req: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    req.headers.get("origin") ||
    `http://${req.headers.get("host") ?? "localhost:3030"}`
  );
}

export async function POST(req: NextRequest) {
  if (!hasStripe) {
    return NextResponse.json(
      { error: "Stripe not configured. Set STRIPE_SECRET_KEY in .env.local." },
      { status: 501 },
    );
  }
  const stripe = getStripe()!;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.items?.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }
  if (!body.tableNumber) {
    return NextResponse.json({ error: "Table not set" }, { status: 400 });
  }

  // 1) Create the order in DB as PENDING + UNPAID. Webhook flips on success.
  const order = await createOrder({
    ...body,
    initialStatus: "pending",
    paid: false,
  });

  // 2) Build Stripe Checkout line items. Show each cart line plus a single
  //    "Service & tax" row so the receipt matches what the customer sees.
  const origin = originFrom(req);
  const lineItems = [
    ...body.items.map((i) => ({
      price_data: {
        currency: STRIPE_CURRENCY,
        product_data: { name: i.name },
        unit_amount: Math.round(i.priceAtOrder * 100),
      },
      quantity: i.quantity,
    })),
    {
      price_data: {
        currency: STRIPE_CURRENCY,
        product_data: { name: "Service charge & SST" },
        unit_amount: Math.round((body.serviceCharge + body.tax) * 100),
      },
      quantity: 1,
    },
  ];

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: stripePaymentMethods(body.paymentMethod) as
        | ["card"]
        | ["grabpay"]
        | ["fpx"],
      line_items: lineItems,
      success_url: `${origin}/order/${order.id}?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?cancelled=1`,
      metadata: {
        order_id: order.id,
        table_number: body.tableNumber,
      },
      payment_intent_data: {
        metadata: { order_id: order.id },
      },
    });

    return NextResponse.json({ url: session.url, orderId: order.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Stripe error";
    return NextResponse.json({ error: msg, orderId: order.id }, { status: 500 });
  }
}
