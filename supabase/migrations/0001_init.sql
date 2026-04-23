-- Cocotei Digital Menu — initial schema

create extension if not exists "pgcrypto";

-- ── enums ─────────────────────────────────────────────────────
do $$ begin create type order_status as enum
  ('pending','confirmed','preparing','ready','served','paid','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin create type payment_status as enum
  ('unpaid','paid','refunded');
exception when duplicate_object then null; end $$;

do $$ begin create type payment_method as enum
  ('card','applepay','grabpay','fpx','tng','cash');
exception when duplicate_object then null; end $$;

-- ── tables ────────────────────────────────────────────────────
create table if not exists categories (
  id          text primary key,
  slug        text not null unique,
  name        text not null,
  name_ja     text,
  icon        text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists menu_items (
  id           text primary key,
  category_id  text not null references categories(id) on delete restrict,
  name         text not null,
  name_ja      text,
  description  text not null default '',
  price        numeric(10,2) not null check (price >= 0),
  image        text not null default '',
  available    boolean not null default true,
  tags         text[] not null default '{}',
  spicy        int    not null default 0,
  sort_order   int    not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_menu_items_category on menu_items(category_id);
create index if not exists idx_menu_items_available on menu_items(available);

create table if not exists orders (
  id              text primary key,
  table_number    text not null,
  subtotal        numeric(10,2) not null,
  service_charge  numeric(10,2) not null default 0,
  tax             numeric(10,2) not null default 0,
  total           numeric(10,2) not null,
  status          order_status   not null default 'pending',
  payment_status  payment_status not null default 'unpaid',
  payment_method  payment_method,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created on orders(created_at desc);

create table if not exists order_items (
  id              bigserial primary key,
  order_id        text not null references orders(id) on delete cascade,
  menu_item_id    text references menu_items(id) on delete set null,
  name            text not null,
  quantity        int  not null check (quantity > 0),
  price_at_order  numeric(10,2) not null,
  notes           text
);
create index if not exists idx_order_items_order on order_items(order_id);

-- ── updated_at trigger ────────────────────────────────────────
create or replace function touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_menu_items_updated on menu_items;
create trigger trg_menu_items_updated
  before update on menu_items
  for each row execute function touch_updated_at();

drop trigger if exists trg_orders_updated on orders;
create trigger trg_orders_updated
  before update on orders
  for each row execute function touch_updated_at();

-- ── RLS (Phase 2 — permissive reads, service-role writes) ─────
alter table categories  enable row level security;
alter table menu_items  enable row level security;
alter table orders      enable row level security;
alter table order_items enable row level security;

drop policy if exists "public read categories"  on categories;
drop policy if exists "public read menu_items"  on menu_items;
drop policy if exists "public read orders"      on orders;
drop policy if exists "public read order_items" on order_items;
drop policy if exists "anyone insert order"      on orders;
drop policy if exists "anyone insert order item" on order_items;

create policy "public read categories"  on categories  for select using (true);
create policy "public read menu_items"  on menu_items  for select using (true);
create policy "public read orders"      on orders      for select using (true);
create policy "public read order_items" on order_items for select using (true);

-- Customers can create orders (Phase 3 will refine to table-scoped)
create policy "anyone insert order"      on orders      for insert with check (true);
create policy "anyone insert order item" on order_items for insert with check (true);

-- Writes on menu are service_role only (no explicit policy = blocked for anon/auth)
-- Phase 5 will add authenticated admin/chef roles.
