-- Phase 6 — Realtime
-- Broadcast changes on the orders table over Supabase Realtime so the
-- kitchen board and customer order page can live-update without polling.
--
-- Note: realtime respects RLS. Our existing policies allow:
--   - public SELECT on orders (customer order page can subscribe)
--   - staff-only UPDATEs (only chefs/admins can trigger updates anyway)
-- Safe to broadcast.

do $$
begin
  alter publication supabase_realtime add table public.orders;
exception
  when duplicate_object then null;
  when undefined_object then
    -- publication doesn't exist (rare; self-hosted setups). Recreate it.
    create publication supabase_realtime for table public.orders;
end
$$;

-- Ensure replica identity is FULL so UPDATE events carry old + new rows.
-- Needed for realtime filters based on row data (we don't use them yet, but
-- keeps the door open).
alter table public.orders replica identity full;
