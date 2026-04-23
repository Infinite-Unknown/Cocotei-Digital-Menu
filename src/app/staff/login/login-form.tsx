"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { loginAction } from "./actions";

export function LoginForm({ supabaseConfigured }: { supabaseConfigured: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await loginAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.replace("/staff");
      router.refresh();
    });
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-muted)]">
            Cocotei
          </div>
          <h1 className="font-display mt-1 text-3xl font-semibold">Staff Sign-in</h1>
          <p className="text-sm text-[var(--color-muted)] mt-2">
            For owners and chefs only.
          </p>
        </div>

        {!supabaseConfigured && (
          <div className="mb-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-xs text-yellow-200">
            Supabase isn&apos;t configured. Set <code>NEXT_PUBLIC_SUPABASE_URL</code> + anon key
            in <code>.env.local</code>.
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Email">
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="input-base"
              placeholder="owner@cocotei.com"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="input-base"
            />
          </Field>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={pending || !supabaseConfigured}
            className="w-full"
          >
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--color-muted)]">
          Forgot password? Ask the owner to reset it from the Supabase dashboard.
        </p>
        <Link
          href="/"
          className="mt-6 block text-center text-xs text-[var(--color-muted)]/70 hover:text-white"
        >
          ← Back to customer site
        </Link>
      </div>
      <style>{`.input-base{background:var(--color-surface-2);border:1px solid var(--color-border);border-radius:.5rem;padding:.6rem .85rem;font-size:.875rem;outline:none;width:100%;color:inherit;}.input-base:focus{border-color:var(--color-gold);}`}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
