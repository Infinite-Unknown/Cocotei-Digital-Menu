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
      return <TngLogo />;
    case "card":
      return <CardStack />;
    case "grabpay":
      // eslint-disable-next-line @next/next/no-img-element
      return (
        <img
          alt="GrabPay"
          src="https://cdn.simpleicons.org/grab/00B14F"
          className="h-6 w-auto"
        />
      );
    case "applepay":
      // eslint-disable-next-line @next/next/no-img-element
      return (
        <img
          alt="Apple Pay"
          src="https://cdn.simpleicons.org/applepay/FFFFFF"
          className="h-6 w-auto"
        />
      );
  }
}

function CardStack() {
  return (
    <span className="flex items-center gap-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt="Visa"
        src="https://cdn.simpleicons.org/visa/1A1F71"
        className="h-4 w-auto"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt="Mastercard"
        src="https://cdn.simpleicons.org/mastercard"
        className="h-5 w-auto"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt="American Express"
        src="https://cdn.simpleicons.org/americanexpress/2E77BC"
        className="h-4 w-auto"
      />
    </span>
  );
}

function CashIcon() {
  // Lucide-style banknote in our gold/green accent
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

function TngLogo() {
  // Approximation of the Touch 'n Go wordmark — navy pill with white italic text.
  // Recognizable enough as a payment-method affordance; not the official asset.
  return (
    <svg
      viewBox="0 0 56 24"
      width="56"
      height="24"
      role="img"
      aria-label="Touch 'n Go eWallet"
    >
      <rect width="56" height="24" rx="5" fill="#003E7E" />
      <text
        x="28"
        y="16.5"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight={800}
        fontStyle="italic"
        fontSize="10"
        fill="#ffffff"
        letterSpacing="0.3"
      >
        Touch&apos;n Go
      </text>
    </svg>
  );
}
