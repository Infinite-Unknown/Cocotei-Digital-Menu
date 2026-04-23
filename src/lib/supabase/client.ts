import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type DB = SupabaseClient<Database>;

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON);

let _browser: DB | null = null;

export function getBrowserClient(): DB | null {
  if (!hasSupabase) return null;
  if (_browser) return _browser;
  _browser = createClient<Database>(SUPABASE_URL, SUPABASE_ANON);
  return _browser;
}

/**
 * Server-side client.
 * - If SUPABASE_SERVICE_ROLE_KEY is set, uses it (bypasses RLS — use for admin writes only).
 * - Otherwise falls back to anon (respects RLS).
 * Always call on the server.
 */
export function getServerClient(): DB | null {
  if (!hasSupabase) return null;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = service || SUPABASE_ANON;
  return createClient<Database>(SUPABASE_URL, key, {
    auth: { persistSession: false },
  });
}
