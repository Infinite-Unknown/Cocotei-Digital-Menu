"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getBrowserAuthClient } from "@/lib/supabase/auth-browser";

type Options = {
  /** Unique channel name. If two mounts use the same name they share a channel. */
  channelName: string;
  /** Postgres table to listen to (public schema). */
  table: string;
  /** Optional Postgres filter, e.g. "id=eq.ORD-ABC123" */
  filter?: string;
  /**
   * Throttle router.refresh() to this many milliseconds minimum between calls.
   * Default 400ms — handles bursts of updates without hammering the server.
   */
  throttleMs?: number;
};

/**
 * Subscribe to Postgres changes on `table` and call `router.refresh()` on
 * INSERT / UPDATE / DELETE. Server components re-execute, client state
 * (useOptimistic, etc.) stays intact thanks to React's transition semantics.
 *
 * Silently no-ops if Supabase isn't configured — caller should keep a polling
 * fallback for that case.
 */
export function useRealtimeRefresh({
  channelName,
  table,
  filter,
  throttleMs = 400,
}: Options) {
  const router = useRouter();
  const lastRefreshRef = useRef(0);
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return;

    const sb = getBrowserAuthClient();

    function triggerRefresh() {
      const now = Date.now();
      const elapsed = now - lastRefreshRef.current;
      if (elapsed >= throttleMs) {
        lastRefreshRef.current = now;
        router.refresh();
      } else if (!pendingRef.current) {
        pendingRef.current = setTimeout(() => {
          pendingRef.current = null;
          lastRefreshRef.current = Date.now();
          router.refresh();
        }, throttleMs - elapsed);
      }
    }

    const channel = sb
      .channel(channelName)
      .on(
        // supabase-js v2 types for postgres_changes are narrow in places; the
        // string literal 'postgres_changes' is the correct runtime value.
        "postgres_changes" as never,
        {
          event: "*",
          schema: "public",
          table,
          ...(filter ? { filter } : {}),
        },
        () => triggerRefresh(),
      )
      .subscribe();

    return () => {
      if (pendingRef.current) {
        clearTimeout(pendingRef.current);
        pendingRef.current = null;
      }
      sb.removeChannel(channel);
    };
  }, [channelName, table, filter, throttleMs, router]);
}
