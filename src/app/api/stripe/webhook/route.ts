import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe, hasStripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { markOrderPaid } from "@/lib/db/orders";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

const PAYMENT_METHOD_MAP: Record<string, "card" | "grabpay" | "fpx"> = {
  card: "card",
  grabpay: "grabpay",
  fpx: "fpx",
};

export async function POST(req: NextRequest) {
  if (!hasStripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 501 });
  }
  if (!STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET missing" },
      { status: 500 },
    );
  }

  const stripe = getStripe()!;
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Stripe needs the raw bytes (not the parsed JSON) to verify the signature.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid signature";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;
        if (orderId && session.payment_status === "paid") {
          const method =
            (session.payment_method_types?.[0] &&
              PAYMENT_METHOD_MAP[session.payment_method_types[0]]) ||
            undefined;
          const paymentIntentId = extractPaymentIntent(session);
          await markOrderPaid(orderId, method, paymentIntentId);
          revalidatePath(`/order/${orderId}`);
          revalidatePath("/kitchen");
          revalidatePath("/admin/orders");
        }
        break;
      }
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;
        if (orderId) {
          const paymentIntentId = extractPaymentIntent(session);
          await markOrderPaid(orderId, undefined, paymentIntentId);
          revalidatePath(`/order/${orderId}`);
          revalidatePath("/kitchen");
          revalidatePath("/admin/orders");
        }
        break;
      }
      default:
        // ignore unhandled events
        break;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Handler error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function extractPaymentIntent(
  session: Stripe.Checkout.Session,
): string | undefined {
  const pi = session.payment_intent;
  if (!pi) return undefined;
  return typeof pi === "string" ? pi : pi.id;
}
