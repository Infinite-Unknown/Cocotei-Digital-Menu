-- Post-Phase 7 polish:
--  - cancel_reason: why an order was cancelled (chip label or custom text)
--  - stripe_payment_intent_id: so we can auto-refund via Stripe API
--  - stripe_refund_id: tracks the refund after it's issued
--  - per-status timestamps: when each status was first entered
--  - trigger: automatically stamps the timestamp on insert/status-change

alter table orders
  add column if not exists cancel_reason text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stripe_refund_id text,
  add column if not exists confirmed_at timestamptz,
  add column if not exists preparing_at timestamptz,
  add column if not exists ready_at timestamptz,
  add column if not exists served_at timestamptz,
  add column if not exists cancelled_at timestamptz;

-- Stamp the relevant column whenever status enters that state.
create or replace function track_status_time()
returns trigger as $$
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
$$ language plpgsql;

drop trigger if exists trg_orders_status_time on orders;
create trigger trg_orders_status_time
  before insert or update on orders
  for each row execute function track_status_time();

-- Backfill confirmed_at for existing non-pending orders using created_at so
-- historical analytics have a baseline. Safe to re-run.
update orders
set confirmed_at = coalesce(confirmed_at, created_at)
where status in ('confirmed','preparing','ready','served','paid')
  and confirmed_at is null;

update orders
set served_at = coalesce(served_at, updated_at)
where status = 'served' and served_at is null;

update orders
set cancelled_at = coalesce(cancelled_at, updated_at)
where status = 'cancelled' and cancelled_at is null;
