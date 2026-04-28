/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

export type PaymentMethod = "cash" | "tng" | "card" | "grabpay" | "applepay";

/**
 * Brand icons for payment methods.
 *  - Card / Apple Pay / Grab use simpleicons.org CDN (MIT, brand colors)
 *  - Cash + TnG use inline SVGs (no external dep)
 *
 * Sizing is consistent: a 48×28 box, icon scaled to fit.
 */
export function PaymentIcon({
  method,
  className,
}: {
  method: PaymentMethod;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 w-12 shrink-0 items-center justify-center",
        className,
      )}
    >
      {render(method)}
    </span>
  );
}

function render(m: PaymentMethod) {
  switch (m) {
    case "cash":
      return <CashIcon />;
    case "tng":
      return (
        <img
          alt="Touch 'n Go eWallet"
          src="/payment-icons/tng.png"
          className="h-8 w-auto"
        />
      );
    case "card":
      return (
        <img
          alt="Credit / Debit Card"
          src="/payment-icons/card.png"
          className="h-8 w-auto"
        />
      );
    case "grabpay":
      return (
        <img
          alt="GrabPay"
          src="/payment-icons/grab.png"
          className="h-8 w-auto"
        />
      );
    case "applepay":
      return (
        <img
          alt="Apple Pay"
          src="/payment-icons/apple.png"
          className="h-8 w-auto"
        />
      );
  }
}

function CashIcon() {
  // Lucide-style banknote in green
  return (
    <svg
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="none"
      stroke="#84cc16"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Cash"
    >
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}
