import "server-only";
import Stripe from "stripe";

export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

export const hasStripe = Boolean(STRIPE_SECRET_KEY);

let _client: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!hasStripe) return null;
  if (_client) return _client;
  // Pin to the version baked into this SDK release.
  _client = new Stripe(STRIPE_SECRET_KEY);
  return _client;
}

export const STRIPE_CURRENCY =
  (process.env.NEXT_PUBLIC_STRIPE_CURRENCY ?? "myr").toLowerCase();

/**
 * Stripe expects payment_method_types as an array. Map our internal method id
 * to Stripe's payment method id. Note: GrabPay/FPX availability depends on
 * your Stripe account being enabled for those methods (check dashboard).
 */
export function stripePaymentMethods(method?: string): string[] {
  switch (method) {
    case "grabpay":
      return ["grabpay"];
    case "fpx":
      return ["fpx"];
    case "applepay":
      return ["card"]; // Apple Pay rides on the card method
    case "card":
    default:
      return ["card"];
  }
}
