"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomerHeader } from "@/components/customer-header";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-store";
import { getItemById } from "@/lib/mock-data";
import { formatPrice, cn } from "@/lib/utils";
import { createOrderAction } from "./actions";
import { PaymentIcon, type PaymentMethod } from "@/components/payment-icon";

type Method = PaymentMethod;

// Order optimised for restaurant speed: fastest (cash) at the top.
const allMethods: Array<{
  id: Method;
  label: string;
  hint: string;
  stripe: boolean;
}> = [
  { id: "cash",     label: "Cash",                  hint: "Pay at counter when served",      stripe: false },
  { id: "tng",      label: "Touch 'n Go eWallet",   hint: "Sign in with phone + OTP",         stripe: false },
  { id: "card",     label: "Credit / Debit Card",   hint: "Visa, Mastercard, Amex",          stripe: true  },
  { id: "grabpay",  label: "GrabPay",               hint: "Grab eWallet",                    stripe: true  },
  { id: "applepay", label: "Apple Pay",             hint: "One tap (rides on card)",         stripe: true  },
];

export function CheckoutView({ stripeEnabled }: { stripeEnabled: boolean }) {
  const router = useRouter();
  const search = useSearchParams();
  const { items, clear, tableNumber } = useCart();
  // Default to cash — fastest path for in-restaurant ordering.
  const [method, setMethod] = useState<Method>("cash");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelledNotice, setCancelledNotice] = useState(
    search.get("cancelled") === "1",
  );

  useEffect(() => {
    if (cancelledNotice) {
      const t = setTimeout(() => setCancelledNotice(false), 8000);
      return () => clearTimeout(t);
    }
  }, [cancelledNotice]);

  const rows = items
    .map((i) => {
      const m = getItemById(i.itemId);
      return m ? { menu: m, qty: i.quantity } : null;
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const subtotal = rows.reduce((s, r) => s + r.menu.price * r.qty, 0);
  const service = +(subtotal * 0.1).toFixed(2);
  const tax = +((subtotal + service) * 0.06).toFixed(2);
  const total = +(subtotal + service + tax).toFixed(2);

  const canPay = rows.length > 0 && !submitting;
  const usesStripe = stripeEnabled && allMethods.find((m) => m.id === method)?.stripe === true;

  async function pay() {
    if (!canPay) return;
    setError(null);
    setSubmitting(true);

    const orderInput = {
      tableNumber: tableNumber ?? "T-??",
      items: rows.map((r) => ({
        menuItemId: r.menu.id,
        name: r.menu.name,
        quantity: r.qty,
        priceAtOrder: r.menu.price,
      })),
      subtotal,
      serviceCharge: service,
      tax,
      total,
    };

    // ── Cash: skip payment, send to kitchen as confirmed-but-unpaid ──────
    if (method === "cash") {
      const res = await createOrderAction({
        ...orderInput,
        paymentMethod: "cash",
        paid: false,
        initialStatus: "confirmed",
      });
      if (!res.ok) return fail(res.error);
      clear();
      router.replace(`/order/${res.orderId}`);
      return;
    }

    // ── Touch 'n Go eWallet: redirect to TnG hosted checkout ─────────────
    // Mock today; structure matches a real TnG-direct or Billplz DuitNow flow
    // so swapping in production is just changing the API endpoint.
    if (method === "tng") {
      try {
        const r = await fetch("/api/tng/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(orderInput),
        });
        const data = (await r.json()) as { url?: string; error?: string };
        if (!r.ok || !data.url) return fail(data.error || "TnG checkout error");
        clear();
        window.location.href = data.url;
        return;
      } catch (e) {
        return fail(e instanceof Error ? e.message : "Network error");
      }
    }

    // ── Stripe Checkout (real card / wallet / FPX / GrabPay) ─────────────
    if (usesStripe) {
      try {
        const r = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...orderInput, paymentMethod: method }),
        });
        const data = (await r.json()) as { url?: string; error?: string };
        if (!r.ok || !data.url) return fail(data.error || "Stripe error");
        clear();
        window.location.href = data.url;
        return;
      } catch (e) {
        return fail(e instanceof Error ? e.message : "Network error");
      }
    }

    // ── Mock mode (Stripe not configured OR method unsupported) ──────────
    await new Promise((r) => setTimeout(r, 800));
    const res = await createOrderAction({
      ...orderInput,
      paymentMethod: method,
      paid: true,
      initialStatus: "confirmed",
    });
    if (!res.ok) return fail(res.error);
    clear();
    router.replace(`/order/${res.orderId}`);
  }

  function fail(msg: string) {
    setError(msg);
    setSubmitting(false);
  }

  const shortSummary = useMemo(() => {
    const count = rows.reduce((s, r) => s + r.qty, 0);
    return `${count} item${count === 1 ? "" : "s"}`;
  }, [rows]);

  const payLabel =
    method === "cash"
      ? `Place order — ${formatPrice(total)}`
      : method === "tng"
        ? `Pay ${formatPrice(total)} via TnG`
        : usesStripe
          ? `Pay ${formatPrice(total)} via Stripe`
          : `Pay ${formatPrice(total)}`;

  return (
    <div className="pb-28">
      <CustomerHeader showBack />
      <div className="mx-auto max-w-xl px-4 pt-4">
        <h1 className="font-display mb-4 text-2xl font-semibold">Checkout</h1>

        {cancelledNotice && (
          <div className="mb-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
            Payment was cancelled. Your cart is still here — pick a method and try again.
          </div>
        )}

        {rows.length === 0 ? (
          <p className="text-[var(--color-muted)]">Nothing to pay for — cart empty.</p>
        ) : (
          <>
            <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-muted)]">Order summary</span>
                <span>{shortSummary}</span>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm">
                {rows.map((r) => (
                  <li key={r.menu.id} className="flex justify-between">
                    <span className="truncate pr-2">
                      <span className="text-[var(--color-muted)]">{r.qty}×</span> {r.menu.name}
                    </span>
                    <span>{formatPrice(r.menu.price * r.qty)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 border-t border-[var(--color-border)] pt-3 space-y-1 text-sm">
                <Row label="Subtotal" value={formatPrice(subtotal)} />
                <Row label="Service (10%)" value={formatPrice(service)} />
                <Row label="SST (6%)" value={formatPrice(tax)} />
                <Row label="Total" value={formatPrice(total)} bold />
              </div>
            </section>

            <section className="mt-6">
              <h2 className="mb-3 flex items-center justify-between text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                <span>Payment method</span>
                {stripeEnabled ? (
                  <span className="text-[10px] text-green-400 normal-case tracking-normal">
                    Stripe enabled
                  </span>
                ) : (
                  <span className="text-[10px] text-yellow-400 normal-case tracking-normal">
                    Stripe not configured · mock mode
                  </span>
                )}
              </h2>
              <div className="space-y-2">
                {allMethods.map((m) => {
                  const isStripeMethod = m.stripe;
                  const willMock = !stripeEnabled && isStripeMethod && m.id !== "cash";
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-xl border bg-[var(--color-surface)] p-3 text-left transition-colors",
                        method === m.id
                          ? "border-[var(--color-gold)] ring-1 ring-[var(--color-gold)]/40"
                          : "border-[var(--color-border)] hover:border-[var(--color-gold)]/40",
                      )}
                    >
                      <PaymentIcon method={m.id} />
                      <span className="flex-1">
                        <span className="block font-medium">{m.label}</span>
                        <span className="block text-xs text-[var(--color-muted)]">
                          {m.hint}
                          {willMock && " · mock"}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "h-5 w-5 rounded-full border-2",
                          method === m.id
                            ? "border-[var(--color-gold)] bg-[var(--color-gold)]"
                            : "border-[var(--color-border)]",
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </section>

            {method === "cash" && (
              <p className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-xs text-[var(--color-muted)]">
                💵 We&apos;ll send your order to the kitchen now. Please pay at the counter when your food arrives — total <span className="text-[var(--color-gold)] font-semibold">{formatPrice(total)}</span>.
              </p>
            )}

            {error && (
              <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <Button size="lg" onClick={pay} disabled={!canPay} className="mt-4 w-full">
              {submitting
                ? method === "cash"
                  ? "Sending to kitchen…"
                  : method === "tng"
                    ? "Redirecting to TnG…"
                    : usesStripe
                      ? "Redirecting to Stripe…"
                      : "Processing…"
                : payLabel}
            </Button>

            {!stripeEnabled && method !== "cash" && (
              <p className="mt-3 text-center text-[10px] text-[var(--color-muted)]/70">
                Mock payment for now. Set <code>STRIPE_SECRET_KEY</code> + <code>STRIPE_WEBHOOK_SECRET</code> in <code>.env.local</code> to enable real Stripe.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-semibold text-base pt-1" : ""}`}>
      <span className={bold ? "" : "text-[var(--color-muted)]"}>{label}</span>
      <span className={bold ? "text-[var(--color-gold)]" : ""}>{value}</span>
    </div>
  );
}
