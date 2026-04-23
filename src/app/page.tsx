import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="max-w-md space-y-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-muted)]">
            Tokyo Japanese Cuisine
          </div>
          <h1 className="font-display mt-2 text-6xl font-semibold tracking-wide">
            Cocotei
          </h1>
          <div className="mt-1 text-xl text-[var(--color-gold)]">日本料理</div>
        </div>

        <div className="space-y-3 pt-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-1.5 text-xs text-[var(--color-muted)]">
            <span className="animate-pulse-soft">●</span> Open · Dine-in
          </div>
          <p className="text-sm text-[var(--color-muted)]">
            Please scan the QR code at your table
            <br />
            to view the menu and place your order.
          </p>
        </div>

        <div className="pt-6">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-gold)]/80 hover:text-[var(--color-gold)]"
          >
            Browse our menu <span>→</span>
          </Link>
        </div>

        <div className="pt-16 text-[10px] uppercase tracking-[0.25em] text-[var(--color-muted)]/60">
          Arigatou gozaimasu · ありがとうございます
        </div>
      </div>
    </main>
  );
}
