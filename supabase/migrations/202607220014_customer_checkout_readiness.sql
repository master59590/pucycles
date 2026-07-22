begin;

alter table public.orders add column if not exists shipping_quote_accepted_at timestamptz;
alter table public.orders add column if not exists terms_accepted_at timestamptz;
alter table public.orders add column if not exists terms_version text;

create or replace function public.set_initial_order_reservation_window()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = 'waiting_payment' and new.shipping_country = 'TH' then
    new.reservation_expires_at := now() + interval '24 hours';
  elsif new.status = 'shipping_quote' then
    new.reservation_expires_at := now() + interval '7 days';
  end if;
  return new;
end;
$$;
drop trigger if exists set_initial_order_reservation_window_trigger on public.orders;
create trigger set_initial_order_reservation_window_trigger before insert on public.orders
for each row execute function public.set_initial_order_reservation_window();

create or replace function public.accept_customer_shipping_quote(p_order_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.orders
  set shipping_quote_accepted_at = now(), updated_at = now()
  where id = p_order_id
    and user_id = auth.uid()
    and shipping_country <> 'TH'
    and status = 'waiting_payment'
    and shipping_fee_thb is not null
    and reservation_expires_at > now();
  if not found then raise exception 'Shipping quote is unavailable or expired'; end if;
  insert into public.order_events(order_id, event_type, title, detail, actor_type, actor_id)
  values (p_order_id, 'shipping_quote_accepted', 'ลูกค้ายืนยันค่าจัดส่ง', null, 'customer', auth.uid());
end;
$$;

create or replace function public.record_customer_terms_acceptance(p_order_id uuid, p_terms_version text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(char_length(trim(p_terms_version)), 0) not between 1 and 40 then raise exception 'Invalid terms version'; end if;
  update public.orders set terms_accepted_at = now(), terms_version = trim(p_terms_version), updated_at = now()
  where id = p_order_id and user_id = auth.uid() and status in ('shipping_quote', 'waiting_payment');
  if not found then raise exception 'Order not found'; end if;
end;
$$;

create or replace function public.admin_set_shipping_quote(p_order_id uuid, p_shipping_fee_thb numeric)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_shipping_fee_thb < 0 or p_shipping_fee_thb > 1000000 then raise exception 'Invalid shipping fee'; end if;
  update public.orders set shipping_fee_thb = p_shipping_fee_thb,
    total_thb = subtotal_thb + p_shipping_fee_thb,
    status = 'waiting_payment', shipping_quote_accepted_at = null,
    reservation_expires_at = now() + interval '3 days', updated_at = now()
  where id = p_order_id and status = 'shipping_quote';
  if not found then raise exception 'Order is not waiting for a shipping quote'; end if;
end;
$$;

create or replace function public.submit_payment_proof(p_order_id uuid, p_storage_path text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_proof_id uuid;
begin
  if not exists (
    select 1 from public.orders
    where id = p_order_id and user_id = auth.uid() and status = 'waiting_payment'
      and reservation_expires_at > now()
      and (shipping_country = 'TH' or shipping_quote_accepted_at is not null)
  ) then raise exception 'Order is not ready for payment'; end if;
  if split_part(p_storage_path, '/', 1) <> auth.uid()::text
    or split_part(p_storage_path, '/', 2) <> p_order_id::text
    or split_part(p_storage_path, '/', 3) = ''
    or split_part(p_storage_path, '/', 4) <> '' then raise exception 'Invalid storage path'; end if;
  if not exists (select 1 from storage.objects where bucket_id = 'payment-proofs' and name = p_storage_path and owner_id = auth.uid()::text)
    then raise exception 'Payment proof was not uploaded'; end if;
  insert into public.payment_proofs (order_id, user_id, storage_path)
  values (p_order_id, auth.uid(), p_storage_path)
  on conflict (order_id) do update set storage_path = excluded.storage_path, status = 'pending', uploaded_at = now(), reviewed_at = null, reviewed_by = null, rejection_reason = null
  returning id into v_proof_id;
  update public.orders set status = 'payment_submitted', updated_at = now() where id = p_order_id;
  return v_proof_id;
end;
$$;

revoke execute on function public.set_initial_order_reservation_window() from public, anon, authenticated;
revoke execute on function public.accept_customer_shipping_quote(uuid) from public, anon;
revoke execute on function public.record_customer_terms_acceptance(uuid,text) from public, anon;
grant execute on function public.accept_customer_shipping_quote(uuid), public.record_customer_terms_acceptance(uuid,text) to authenticated;

notify pgrst, 'reload schema';
commit;
