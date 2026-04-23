import { CheckoutView } from "./checkout-view";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  // Read at request time (server). Becomes a static prop on the client.
  const stripeEnabled = Boolean(process.env.STRIPE_SECRET_KEY);
  return <CheckoutView stripeEnabled={stripeEnabled} />;
}
