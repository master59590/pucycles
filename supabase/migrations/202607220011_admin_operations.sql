begin;

alter table public.orders add column if not exists payment_instructions jsonb;
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (status in (
  'shipping_quote', 'waiting_payment', 'payment_submitted', 'paid', 'preparing',
  'shipped', 'cancelled', 'refund_pending', 'refunded'
));

insert into public.app_settings(key, value) values
  ('bank_transfer', jsonb_build_object('bank_name', 'ธนาคารกสิกรไทย', 'account_name', 'จุฑารัตน์ อินทรณรงค์', 'account_number', '0348696793')),
  ('western_union', jsonb_build_object('receiver_name', '', 'country', 'Thailand', 'city', '', 'phone', '', 'instructions', ''))
on conflict (key) do nothing;

update public.orders
set payment_instructions = case when shipping_country = 'TH'
  then (select value from public.app_settings where key = 'bank_transfer')
  else (select value from public.app_settings where key = 'western_union') end
where payment_instructions is null;

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  event_type text not null,
  title text not null,
  detail text,
  status_from text,
  status_to text,
  actor_type text not null default 'system' check (actor_type in ('customer', 'admin', 'system')),
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists order_events_order_created_idx on public.order_events(order_id, created_at desc);

create table if not exists public.order_refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  amount_thb numeric(12,2) not null check (amount_thb >= 0),
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  previous_order_status text not null default 'paid',
  transfer_reference text,
  restocked boolean not null default false,
  requested_by uuid references auth.users(id) on delete set null,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (order_id, status)
);

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists admin_notifications_unread_idx on public.admin_notifications(created_at desc) where not is_read;

create table if not exists public.admin_login_events (
  id bigint generated always as identity primary key,
  admin_user_id uuid references auth.users(id) on delete set null,
  user_agent text not null default '',
  created_at timestamptz not null default now()
);

alter table public.order_events enable row level security;
alter table public.order_refunds enable row level security;
alter table public.admin_notifications enable row level security;
alter table public.admin_login_events enable row level security;

drop policy if exists "admins read order events" on public.order_events;
create policy "admins read order events" on public.order_events for select to authenticated using (public.is_admin());
drop policy if exists "customers read own order events" on public.order_events;
create policy "customers read own order events" on public.order_events for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
drop policy if exists "admins read refunds" on public.order_refunds;
create policy "admins read refunds" on public.order_refunds for select to authenticated using (public.is_admin());
drop policy if exists "admins read notifications" on public.admin_notifications;
create policy "admins read notifications" on public.admin_notifications for select to authenticated using (public.is_admin());
drop policy if exists "admins read login events" on public.admin_login_events;
create policy "admins read login events" on public.admin_login_events for select to authenticated using (public.is_admin());

create or replace function public.snapshot_order_payment_instructions()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.payment_instructions is null then
    if new.shipping_country = 'TH' then
      new.payment_instructions := coalesce((select value from public.app_settings where key = 'bank_transfer'), '{}'::jsonb);
    else
      new.payment_instructions := coalesce((select value from public.app_settings where key = 'western_union'), '{}'::jsonb);
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists snapshot_order_payment_instructions_trigger on public.orders;
create trigger snapshot_order_payment_instructions_trigger before insert on public.orders
for each row execute function public.snapshot_order_payment_instructions();

create or replace function public.record_order_event()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_actor text := case when auth.uid() is null then 'system' when public.is_admin() then 'admin' else 'customer' end;
  v_title text;
begin
  if tg_op = 'INSERT' then
    insert into public.order_events(order_id, event_type, title, detail, status_to, actor_type, actor_id)
    values (new.id, 'order_created', 'สร้างคำสั่งซื้อ', new.order_number, new.status, v_actor, auth.uid());
    insert into public.admin_notifications(order_id, kind, title, body)
    values (new.id, 'new_order', 'มีคำสั่งซื้อใหม่', new.order_number || ' · ' || new.customer_name);
  elsif old.status is distinct from new.status then
    v_title := case new.status
      when 'shipping_quote' then 'รอแจ้งค่าจัดส่ง'
      when 'waiting_payment' then 'รอชำระเงิน'
      when 'payment_submitted' then 'ลูกค้าส่งหลักฐานชำระเงิน'
      when 'paid' then 'ยืนยันการชำระเงิน'
      when 'preparing' then 'เริ่มเตรียมสินค้า'
      when 'shipped' then 'จัดส่งสินค้าแล้ว'
      when 'cancelled' then 'ยกเลิกคำสั่งซื้อ'
      when 'refund_pending' then 'เริ่มดำเนินการคืนเงิน'
      when 'refunded' then 'คืนเงินเรียบร้อยแล้ว'
      else 'เปลี่ยนสถานะคำสั่งซื้อ' end;
    insert into public.order_events(order_id, event_type, title, status_from, status_to, actor_type, actor_id)
    values (new.id, 'status_changed', v_title, old.status, new.status, v_actor, auth.uid());
    if new.status in ('shipping_quote', 'payment_submitted') then
      insert into public.admin_notifications(order_id, kind, title, body)
      values (new.id, new.status, v_title, new.order_number || ' · ' || new.customer_name);
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists record_order_event_trigger on public.orders;
create trigger record_order_event_trigger after insert or update of status on public.orders
for each row execute function public.record_order_event();

create or replace function public.notify_low_stock()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_available integer;
begin
  v_available := greatest(0, new.stock_quantity - new.reserved_quantity);
  if v_available <= 2 and greatest(0, old.stock_quantity - old.reserved_quantity) > 2 then
    insert into public.admin_notifications(kind, title, body)
    values ('low_stock', case when v_available = 0 then 'สินค้าหมด' else 'สินค้าเหลือน้อย' end, new.sku || ' · ' || new.name_en || ' · พร้อมขาย ' || v_available || ' ชิ้น');
  end if;
  return new;
end;
$$;
drop trigger if exists notify_low_stock_trigger on public.products;
create trigger notify_low_stock_trigger after update of stock_quantity, reserved_quantity on public.products
for each row execute function public.notify_low_stock();

create or replace function public.admin_mark_notification_read(p_notification_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  update public.admin_notifications set is_read = true where id = p_notification_id;
end;
$$;

create or replace function public.admin_mark_all_notifications_read()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  update public.admin_notifications set is_read = true where not is_read;
end;
$$;

create or replace function public.admin_record_login(p_user_agent text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  insert into public.admin_login_events(admin_user_id, user_agent) values (auth.uid(), left(coalesce(p_user_agent, ''), 500));
end;
$$;

create or replace function public.admin_set_payment_settings(
  p_bank_name text, p_bank_account_name text, p_bank_account_number text,
  p_wu_receiver_name text, p_wu_country text, p_wu_city text, p_wu_phone text, p_wu_instructions text
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if coalesce(char_length(trim(p_bank_name)), 0) < 1 or coalesce(char_length(trim(p_bank_account_name)), 0) < 1 or coalesce(char_length(trim(p_bank_account_number)), 0) < 3 then
    raise exception 'Bank transfer details are required';
  end if;
  insert into public.app_settings(key, value) values
    ('bank_transfer', jsonb_build_object('bank_name', trim(p_bank_name), 'account_name', trim(p_bank_account_name), 'account_number', trim(p_bank_account_number))),
    ('western_union', jsonb_build_object('receiver_name', trim(coalesce(p_wu_receiver_name,'')), 'country', trim(coalesce(p_wu_country,'')), 'city', trim(coalesce(p_wu_city,'')), 'phone', trim(coalesce(p_wu_phone,'')), 'instructions', trim(coalesce(p_wu_instructions,''))))
  on conflict (key) do update set value = excluded.value;
end;
$$;

create or replace function public.admin_run_expired_reservations()
returns integer language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  return public.release_expired_order_reservations();
end;
$$;

create or replace function public.get_admin_operations_status()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_configured boolean := false;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  begin
    execute 'select exists (select 1 from cron.job where jobname = ''pucycles-release-expired-reservations'')' into v_configured;
  exception when others then v_configured := false;
  end;
  return jsonb_build_object('cron_configured', v_configured);
end;
$$;

create or replace function public.admin_add_order_note(p_order_id uuid, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if coalesce(char_length(trim(p_note)),0) not between 1 and 1000 then raise exception 'Note must be between 1 and 1000 characters'; end if;
  if not exists(select 1 from public.orders where id = p_order_id) then raise exception 'Order not found'; end if;
  insert into public.order_events(order_id, event_type, title, detail, actor_type, actor_id)
  values (p_order_id, 'internal_note', 'หมายเหตุภายใน', trim(p_note), 'admin', auth.uid());
end;
$$;

create or replace function public.admin_confirm_payment(p_order_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if not exists (select 1 from public.orders where id = p_order_id and status = 'payment_submitted' for update) then
    raise exception 'Order is not waiting for payment review';
  end if;
  perform pg_catalog.set_config('app.stock_reason', 'online_order', true);
  update public.products p
  set stock_quantity = p.stock_quantity - oi.quantity,
      reserved_quantity = greatest(0, p.reserved_quantity - oi.quantity),
      updated_at = now()
  from public.order_items oi where oi.order_id = p_order_id and oi.product_id = p.id;
  update public.payment_proofs set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid() where order_id = p_order_id;
  update public.orders set status = 'paid', reservation_expires_at = now(), updated_at = now() where id = p_order_id;
end;
$$;

create or replace function public.admin_start_refund(p_order_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_order public.orders%rowtype;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if coalesce(char_length(trim(p_reason)),0) not between 3 and 500 then raise exception 'Refund reason must be between 3 and 500 characters'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.status not in ('paid','preparing','shipped') then raise exception 'Order cannot be refunded'; end if;
  delete from public.order_refunds where order_id = p_order_id and status = 'cancelled';
  insert into public.order_refunds(order_id, amount_thb, reason, previous_order_status, requested_by)
  values (p_order_id, coalesce(v_order.total_thb, v_order.subtotal_thb), trim(p_reason), v_order.status, auth.uid());
  update public.orders set status = 'refund_pending', updated_at = now() where id = p_order_id;
end;
$$;

create or replace function public.admin_cancel_refund(p_order_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_previous text;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  update public.order_refunds set status = 'cancelled' where order_id = p_order_id and status = 'pending' returning previous_order_status into v_previous;
  if not found then raise exception 'Pending refund not found'; end if;
  update public.orders set status = v_previous, updated_at = now() where id = p_order_id and status = 'refund_pending';
end;
$$;

create or replace function public.admin_complete_refund(p_order_id uuid, p_transfer_reference text, p_restock boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if coalesce(char_length(trim(p_transfer_reference)),0) not between 2 and 160 then raise exception 'Refund reference is required'; end if;
  if coalesce(p_restock,false) then
    perform pg_catalog.set_config('app.stock_reason', 'customer_return', true);
    update public.products p set stock_quantity = p.stock_quantity + oi.quantity, updated_at = now()
    from public.order_items oi where oi.order_id = p_order_id and oi.product_id = p.id;
  end if;
  update public.order_refunds set status = 'completed', transfer_reference = trim(p_transfer_reference), restocked = coalesce(p_restock,false), completed_at = now()
  where order_id = p_order_id and status = 'pending';
  if not found then raise exception 'Pending refund not found'; end if;
  update public.orders set status = 'refunded', updated_at = now() where id = p_order_id and status = 'refund_pending';
end;
$$;

do $$
begin
  begin
    create extension if not exists pg_cron;
    if not exists (select 1 from cron.job where jobname = 'pucycles-release-expired-reservations') then
      perform cron.schedule('pucycles-release-expired-reservations', '*/15 * * * *', 'select public.release_expired_order_reservations()');
    end if;
  exception when others then
    raise notice 'pg_cron could not be configured automatically: %', sqlerrm;
  end;
end;
$$;

grant select on public.order_events, public.order_refunds, public.admin_notifications, public.admin_login_events to authenticated;
revoke execute on function public.snapshot_order_payment_instructions() from public, anon, authenticated;
revoke execute on function public.record_order_event() from public, anon, authenticated;
revoke execute on function public.notify_low_stock() from public, anon, authenticated;
revoke execute on function public.admin_mark_notification_read(uuid) from public, anon;
revoke execute on function public.admin_mark_all_notifications_read() from public, anon;
revoke execute on function public.admin_record_login(text) from public, anon;
revoke execute on function public.admin_set_payment_settings(text,text,text,text,text,text,text,text) from public, anon;
revoke execute on function public.admin_run_expired_reservations() from public, anon;
revoke execute on function public.get_admin_operations_status() from public, anon;
revoke execute on function public.admin_add_order_note(uuid,text) from public, anon;
revoke execute on function public.admin_start_refund(uuid,text) from public, anon;
revoke execute on function public.admin_cancel_refund(uuid) from public, anon;
revoke execute on function public.admin_complete_refund(uuid,text,boolean) from public, anon;
grant execute on function public.admin_mark_notification_read(uuid), public.admin_mark_all_notifications_read(), public.admin_record_login(text), public.admin_set_payment_settings(text,text,text,text,text,text,text,text), public.admin_run_expired_reservations(), public.get_admin_operations_status(), public.admin_add_order_note(uuid,text), public.admin_start_refund(uuid,text), public.admin_cancel_refund(uuid), public.admin_complete_refund(uuid,text,boolean) to authenticated;

notify pgrst, 'reload schema';
commit;
