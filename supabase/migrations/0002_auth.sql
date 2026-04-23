-- Phase 5 — Auth + role gates
-- Adds a profiles table mapping auth.users → role (admin | chef),
-- and tightens RLS so menu mutations require admin and order updates
-- require admin OR chef. Webhook + seed continue to use service_role
-- which bypasses RLS.

-- ── profiles ─────────────────────────────────────────────────
create table if not exists profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  role         text not null check (role in ('admin','chef')),
  display_name text,
  created_at   timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "users read own profile" on profiles;
create policy "users read own profile"
  on profiles for select
  using (auth.uid() = user_id);

-- helper for cleaner policies
create or replace function is_role(target text)
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from profiles
    where user_id = auth.uid()
      and role = target
  );
$$;

create or replace function is_staff()
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from profiles
    where user_id = auth.uid()
      and role in ('admin','chef')
  );
$$;

-- ── menu_items: only admins can mutate (anon still reads) ────
drop policy if exists "admin insert menu_items" on menu_items;
drop policy if exists "admin update menu_items" on menu_items;
drop policy if exists "admin delete menu_items" on menu_items;

create policy "admin insert menu_items"
  on menu_items for insert
  with check (is_role('admin'));

create policy "admin update menu_items"
  on menu_items for update
  using (is_role('admin'))
  with check (is_role('admin'));

create policy "admin delete menu_items"
  on menu_items for delete
  using (is_role('admin'));

-- ── categories: only admins can mutate ────────────────────────
drop policy if exists "admin insert categories" on categories;
drop policy if exists "admin update categories" on categories;
drop policy if exists "admin delete categories" on categories;

create policy "admin insert categories"
  on categories for insert
  with check (is_role('admin'));

create policy "admin update categories"
  on categories for update
  using (is_role('admin'))
  with check (is_role('admin'));

create policy "admin delete categories"
  on categories for delete
  using (is_role('admin'));

-- ── orders: anon insert (customer checkout) stays. Updates restricted to staff.
drop policy if exists "staff update orders" on orders;
create policy "staff update orders"
  on orders for update
  using (is_staff())
  with check (is_staff());

-- ────────────────────────────────────────────────────────────
-- Bootstrap your first admin AFTER running this migration:
--
--   1. In Supabase Dashboard → Authentication → Users → Add user
--      Create the owner with email + password (auto-confirms).
--   2. Run this in SQL Editor (replace the email):
--
--      insert into profiles (user_id, role, display_name)
--      select id, 'admin', 'Owner'
--      from auth.users
--      where email = 'owner@cocotei.com';
--
--   3. Repeat for chef account with role = 'chef'.
-- ────────────────────────────────────────────────────────────
