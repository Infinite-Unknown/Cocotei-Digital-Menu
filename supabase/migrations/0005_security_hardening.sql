-- Addresses Supabase linter warnings:
--   1. function_search_path_mutable — pins search_path on every plpgsql/sql function
--   2. rls_policy_always_true — replaces `with check (true)` on the order insert
--      policies with meaningful sanity checks (non-empty ids, non-negative amounts,
--      positive quantities). Restricts policies to anon + authenticated roles.
--
-- The one remaining warning (`auth_leaked_password_protection`) is a dashboard
-- toggle, not a SQL setting:
--   Dashboard → Authentication → Policies → Password Protection
--   Toggle "Check for leaked passwords against HaveIBeenPwned"

-- ── 1. Pin search_path on helper functions ───────────────────

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.is_role(target text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid()
      and role = target
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid()
      and role in ('admin','chef')
  );
$$;

create or replace function public.track_status_time()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT'
     or (tg_op = 'UPDATE' and old.status is distinct from new.status) then
    case new.status
      when 'confirmed' then
        new.confirmed_at := coalesce(new.confirmed_at, now());
      when 'preparing' then
        new.preparing_at := coalesce(new.preparing_at, now());
      when 'ready' then
        new.ready_at := coalesce(new.ready_at, now());
      when 'served' then
        new.served_at := coalesce(new.served_at, now());
      when 'cancelled' then
        new.cancelled_at := coalesce(new.cancelled_at, now());
      else null;
    end case;
  end if;
  return new;
end;
$$;

-- ── 2. Replace unbounded INSERT policies with sanity-checked ones ──

drop policy if exists "anyone insert order" on public.orders;
create policy "anyone insert order"
  on public.orders
  for insert
  to anon, authenticated
  with check (
    length(id) between 4 and 32
    and length(table_number) between 1 and 32
    and subtotal >= 0
    and service_charge >= 0
    and tax >= 0
    and total >= 0
    and total <= 100000        -- RM100k sanity cap per order
  );

drop policy if exists "anyone insert order item" on public.order_items;
create policy "anyone insert order item"
  on public.order_items
  for insert
  to anon, authenticated
  with check (
    quantity between 1 and 999
    and price_at_order >= 0
    and length(name) between 1 and 200
    and order_id is not null
    -- Tie the inserted row to an order that actually exists + was placed
    -- recently (prevents attaching items to old orders).
    and exists (
      select 1
      from public.orders o
      where o.id = order_id
        and o.created_at > now() - interval '1 hour'
    )
  );
