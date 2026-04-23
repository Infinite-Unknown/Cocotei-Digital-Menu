import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { SUPABASE_URL, SUPABASE_ANON, hasSupabase } from "./client";

/**
 * Request-scoped, cookie-aware Supabase client. Uses the authenticated user's
 * session from request cookies — RLS applies. Use for auth lookups + reads
 * that should respect the current user's permissions. For privileged writes
 * that bypass RLS, use `getServerClient()` from ./client.
 */
export async function getRequestSupabase() {
  if (!hasSupabase) return null;
  const store = await cookies();
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) {
            store.set(name, value, options);
          }
        } catch {
          // Server components can't mutate cookies — middleware handles refresh.
        }
      },
    },
  });
}
