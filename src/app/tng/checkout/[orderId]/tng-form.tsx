"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Order } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { confirmTngPaymentAction } from "./actions";

type Step = "phone" | "otp" | "processing" | "success";

export function TngCheckoutForm({ order }: { order: Order }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const phoneRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "phone") phoneRef.current?.focus();
    if (step === "otp") otpRef.current?.focus();
  }, [step]);

  function sendOtp() {
    setError(null);
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 9) {
      setError("Enter a valid Malaysian mobile number");
      return;
    }
    setStep("otp");
  }

  function pay() {
    setError(null);
    if (otp.length < 4) {
      setError("Enter the 6-digit OTP");
      return;
    }
    setStep("processing");
    startTransition(async () => {
      // Tiny delay to mirror real TnG processing latency
      await new Promise((r) => setTimeout(r, 1200));
      const res = await confirmTngPaymentAction(order.id);
      if (!res.ok) {
        setError(res.error);
        setStep("otp");
        return;
      }
      setStep("success");
      await new Promise((r) => setTimeout(r, 600));
      router.replace(`/order/${order.id}?paid=1`);
    });
  }

  function cancel() {
    router.replace("/checkout?cancelled=1");
  }

  return (
    <main className="min-h-dvh flex flex-col bg-[#003E7E] text-white">
      <header className="px-5 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/payment-icons/tng.png"
            alt="Touch 'n Go eWallet"
            className="h-8 w-auto rounded"
          />
          <span className="text-xs uppercase tracking-[0.2em] text-yellow-400">
            Web Payment
          </span>
        </div>
        <button
          onClick={cancel}
          disabled={pending}
          className="text-xs text-white/60 hover:text-white"
        >
          Cancel
        </button>
      </header>

      <section className="px-5 py-4 border-b border-white/10 bg-white/5">
        <div className="text-[10px] uppercase tracking-[0.2em] text-yellow-300">
          Payment to
        </div>
        <div className="mt-1 font-semibold">Cocotei — Tokyo Japanese Cuisine</div>
        <div className="mt-3 flex items-end justify-between">
          <div className="text-xs text-white/60">
            Order <span className="font-mono">{order.id}</span> · Table {order.tableNumber}
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            {formatPrice(order.total)}
          </div>
        </div>
      </section>

      <div className="flex-1 px-5 py-8 max-w-md w-full mx-auto">
        {step === "phone" && (
          <>
            <h1 className="text-lg font-semibold">Sign in to pay</h1>
            <p className="mt-1 text-sm text-white/60">
              Enter your TnG eWallet mobile number.
            </p>
            <div className="mt-6">
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">
                Mobile number
              </label>
              <div className="flex items-center rounded-lg bg-white/10 border border-white/20 focus-within:border-yellow-400">
                <span className="px-3 py-3 text-sm text-white/70 border-r border-white/20">
                  🇲🇾 +60
                </span>
                <input
                  ref={phoneRef}
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
                  }
                  placeholder="12 345 6789"
                  className="flex-1 bg-transparent px-3 py-3 outline-none text-base"
                  onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-500/20 border border-red-300/30 px-3 py-2 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={sendOtp}
              disabled={!phone}
              className="mt-8 w-full rounded-xl bg-yellow-400 py-3 font-bold text-[#003E7E] disabled:opacity-50"
            >
              Send OTP
            </button>

            <p className="mt-6 text-center text-[10px] uppercase tracking-[0.15em] text-white/40">
              Mock TnG checkout · No real payment
            </p>
          </>
        )}

        {step === "otp" && (
          <>
            <h1 className="text-lg font-semibold">Enter OTP</h1>
            <p className="mt-1 text-sm text-white/60">
              Sent to +60 {phone || "•••• ••••"} — any 6 digits work in this demo.
            </p>
            <div className="mt-6">
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">
                One-time password
              </label>
              <input
                ref={otpRef}
                type="tel"
                inputMode="numeric"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="••••••"
                className="w-full rounded-lg bg-white/10 border border-white/20 focus:border-yellow-400 px-3 py-3 text-center text-2xl tracking-[0.5em] outline-none"
                onKeyDown={(e) => e.key === "Enter" && pay()}
                maxLength={6}
              />
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-500/20 border border-red-300/30 px-3 py-2 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={pay}
              disabled={otp.length < 4}
              className="mt-8 w-full rounded-xl bg-yellow-400 py-3 font-bold text-[#003E7E] disabled:opacity-50"
            >
              Pay {formatPrice(order.total)}
            </button>

            <button
              onClick={() => setStep("phone")}
              className="mt-3 w-full text-center text-xs text-white/60 hover:text-white"
            >
              ← Use a different number
            </button>
          </>
        )}

        {(step === "processing" || step === "success") && (
          <div className="flex flex-col items-center justify-center text-center pt-12">
            {step === "processing" ? (
              <>
                <div className="h-12 w-12 rounded-full border-4 border-yellow-400/30 border-t-yellow-400 animate-spin" />
                <p className="mt-6 text-sm text-white/70">Processing payment…</p>
              </>
            ) : (
              <>
                <div className="text-6xl">✓</div>
                <h1 className="mt-3 text-xl font-bold">Payment successful</h1>
                <p className="mt-1 text-sm text-white/60">
                  Sending you back to your order…
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <footer className="px-5 py-3 text-center text-[10px] text-white/40">
        Powered by <span className="text-white/70">Touch &apos;n Go eWallet</span> · Secure payment
      </footer>
    </main>
  );
}
