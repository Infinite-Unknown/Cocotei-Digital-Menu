"use client";

import { useState, useTransition } from "react";
import { markCashPaidAction } from "./actions";

export function MarkPaidButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    if (!confirm(`Mark ${orderId} as cash paid?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await markCashPaidAction(orderId);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <>
      <button
        onClick={onClick}
        disabled={pending}
        className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-2.5 py-1 text-xs text-yellow-200 hover:bg-yellow-500/20 disabled:opacity-50"
      >
        {pending ? "Saving…" : "💵 Mark paid"}
      </button>
      {error && (
        <span className="ml-2 text-xs text-red-300" title={error}>
          ⚠
        </span>
      )}
    </>
  );
}
