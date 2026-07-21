begin;

alter table public.profiles
  add column if not exists saved_shipping_name text,
  add column if not exists saved_shipping_phone text,
  add column if not exists saved_shipping_address text,
  add column if not exists saved_shipping_city text,
  add column if not exists saved_postal_code text;

alter table public.payment_proofs
  add column if not exists rejection_reason text;

create or replace function public.save_latest_order_address()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set saved_shipping_name = new.customer_name,
      saved_shipping_phone = new.customer_phone,
      saved_shipping_address = new.shipping_address,
      saved_shipping_city = new.shipping_city,
      saved_postal_code = new.postal_code,
      country_code = new.shipping_country,
      updated_at = now()
  where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists save_latest_order_address_trigger on public.orders;
create trigger save_latest_order_address_trigger
after insert on public.orders
for each row execute function public.save_latest_order_address();

update public.profiles p
set (saved_shipping_name, saved_shipping_phone, saved_shipping_address, saved_shipping_city, saved_postal_code, country_code) = (
      select o.customer_name, o.customer_phone, o.shipping_address, o.shipping_city, o.postal_code, o.shipping_country
      from public.orders o
      where o.user_id = p.id
      order by o.created_at desc
      limit 1
    ),
    updated_at = now()
where p.saved_shipping_name is null
  and exists (select 1 from public.orders o where o.user_id = p.id);

create or replace function public.update_customer_order_address(
  p_order_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_shipping_address text,
  p_shipping_city text,
  p_postal_code text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(char_length(trim(p_customer_name)), 0) not between 1 and 120
    or coalesce(char_length(trim(p_customer_phone)), 0) not between 3 and 40
    or coalesce(char_length(trim(p_shipping_address)), 0) not between 3 and 500
    or coalesce(char_length(trim(p_shipping_city)), 0) not between 1 and 120
    or coalesce(char_length(trim(p_postal_code)), 0) not between 1 and 20
  then raise exception 'Complete all delivery fields'; end if;

  update public.orders
  set customer_name = trim(p_customer_name),
      customer_phone = trim(p_customer_phone),
      shipping_address = trim(p_shipping_address),
      shipping_city = trim(p_shipping_city),
      postal_code = trim(p_postal_code),
      updated_at = now()
  where id = p_order_id and user_id = auth.uid() and status in ('shipping_quote', 'waiting_payment');
  if not found then raise exception 'Order can no longer be edited'; end if;

  update public.profiles
  set saved_shipping_name = trim(p_customer_name),
      saved_shipping_phone = trim(p_customer_phone),
      saved_shipping_address = trim(p_shipping_address),
      saved_shipping_city = trim(p_shipping_city),
      saved_postal_code = trim(p_postal_code),
      updated_at = now()
  where id = auth.uid();
end;
$$;

create or replace function public.submit_payment_proof(p_order_id uuid, p_storage_path text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_proof_id uuid;
begin
  if not exists (select 1 from public.orders where id = p_order_id and user_id = auth.uid() and status = 'waiting_payment') then
    raise exception 'Order is not ready for payment';
  end if;
  if split_part(p_storage_path, '/', 1) <> auth.uid()::text
    or split_part(p_storage_path, '/', 2) <> p_order_id::text
    or split_part(p_storage_path, '/', 3) = ''
    or split_part(p_storage_path, '/', 4) <> '' then
    raise exception 'Invalid storage path';
  end if;
  if not exists (
    select 1 from storage.objects
    where bucket_id = 'payment-proofs' and name = p_storage_path and owner_id = auth.uid()::text
  ) then raise exception 'Payment proof was not uploaded'; end if;

  insert into public.payment_proofs (order_id, user_id, storage_path)
  values (p_order_id, auth.uid(), p_storage_path)
  on conflict (order_id) do update
  set storage_path = excluded.storage_path,
      status = 'pending',
      uploaded_at = now(),
      reviewed_at = null,
      reviewed_by = null,
      rejection_reason = null
  returning id into v_proof_id;

  update public.orders set status = 'payment_submitted', updated_at = now() where id = p_order_id;
  return v_proof_id;
end;
$$;

create or replace function public.admin_reject_payment(p_order_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if coalesce(char_length(trim(p_reason)), 0) not between 3 and 500 then
    raise exception 'Rejection reason must be between 3 and 500 characters';
  end if;
  if not exists (select 1 from public.orders where id = p_order_id and status = 'payment_submitted' for update) then
    raise exception 'Order is not waiting for payment review';
  end if;

  update public.payment_proofs
  set status = 'rejected', rejection_reason = trim(p_reason), reviewed_at = now(), reviewed_by = auth.uid()
  where order_id = p_order_id;
  update public.orders
  set status = 'waiting_payment', reservation_expires_at = now() + interval '3 days', updated_at = now()
  where id = p_order_id;
end;
$$;

create or replace function public.admin_update_order_address(
  p_order_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_shipping_address text,
  p_shipping_city text,
  p_postal_code text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if coalesce(char_length(trim(p_customer_name)), 0) not between 1 and 120
    or coalesce(char_length(trim(p_customer_phone)), 0) not between 3 and 40
    or coalesce(char_length(trim(p_shipping_address)), 0) not between 3 and 500
    or coalesce(char_length(trim(p_shipping_city)), 0) not between 1 and 120
    or coalesce(char_length(trim(p_postal_code)), 0) not between 1 and 20
  then raise exception 'Complete all delivery fields'; end if;

  update public.orders
  set customer_name = trim(p_customer_name),
      customer_phone = trim(p_customer_phone),
      shipping_address = trim(p_shipping_address),
      shipping_city = trim(p_shipping_city),
      postal_code = trim(p_postal_code),
      updated_at = now()
  where id = p_order_id and status not in ('shipped', 'cancelled');
  if not found then raise exception 'Order can no longer be edited'; end if;
end;
$$;

create or replace function public.admin_set_order_stage(p_order_id uuid, p_target_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_target_status = 'preparing' then
    update public.orders set status = 'preparing', updated_at = now() where id = p_order_id and status = 'paid';
  elsif p_target_status = 'paid' then
    update public.orders set status = 'paid', updated_at = now() where id = p_order_id and status = 'preparing';
  else
    raise exception 'Invalid order stage';
  end if;
  if not found then raise exception 'Order cannot move to the requested stage'; end if;
end;
$$;

create or replace function public.admin_update_tracking(p_order_id uuid, p_shipping_company text, p_tracking_number text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if coalesce(char_length(trim(p_shipping_company)), 0) not between 1 and 120
    or coalesce(char_length(trim(p_tracking_number)), 0) not between 1 and 120
  then raise exception 'Shipping company and tracking number are required'; end if;
  update public.orders
  set shipping_company = trim(p_shipping_company), tracking_number = trim(p_tracking_number), updated_at = now()
  where id = p_order_id and status = 'shipped';
  if not found then raise exception 'Tracking can only be edited after shipment'; end if;
end;
$$;

revoke execute on function public.save_latest_order_address() from public, anon, authenticated;
revoke execute on function public.admin_reject_payment(uuid, text) from public, anon;
revoke execute on function public.admin_update_order_address(uuid, text, text, text, text, text) from public, anon;
revoke execute on function public.admin_set_order_stage(uuid, text) from public, anon;
revoke execute on function public.admin_update_tracking(uuid, text, text) from public, anon;

grant execute on function public.admin_reject_payment(uuid, text) to authenticated;
grant execute on function public.admin_update_order_address(uuid, text, text, text, text, text) to authenticated;
grant execute on function public.admin_set_order_stage(uuid, text) to authenticated;
grant execute on function public.admin_update_tracking(uuid, text, text) to authenticated;

commit;
