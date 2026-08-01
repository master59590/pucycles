create or replace function public.create_customer_order(
  p_customer_name text,
  p_customer_phone text,
  p_shipping_country text,
  p_shipping_address text,
  p_shipping_city text,
  p_postal_code text,
  p_items jsonb
)
returns table (order_id uuid, order_number text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_order_number text;
  v_subtotal numeric(12,2) := 0;
  v_shipping numeric(12,2);
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Cart is empty'; end if;
  if jsonb_array_length(p_items) > 50 then raise exception 'Too many cart items'; end if;
  if p_shipping_country not in ('TH', 'AT', 'AU', 'PH', 'AE', 'IN') then raise exception 'Unsupported country'; end if;
  if char_length(trim(p_customer_name)) not between 1 and 120
    or char_length(trim(p_customer_phone)) not between 3 and 40
    or char_length(trim(p_shipping_address)) not between 3 and 500
    or char_length(trim(p_shipping_city)) not between 1 and 120
    or char_length(trim(p_postal_code)) not between 1 and 20 then
    raise exception 'Invalid customer or shipping details';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) as items(item)
    group by item ->> 'product_id' having count(*) > 1
  ) then raise exception 'Duplicate product in cart'; end if;

  perform public.release_expired_order_reservations();
  if (select count(*) from public.orders where user_id = auth.uid() and status in ('shipping_quote', 'waiting_payment', 'payment_submitted')) >= 5 then
    raise exception 'Too many active orders';
  end if;

  v_shipping := case when p_shipping_country = 'TH' then coalesce((select (value #>> '{}')::numeric from public.app_settings where key = 'thai_shipping_fee_thb'), 120) else null end;
  v_order_number := 'PUC-' || to_char(clock_timestamp(), 'YYMMDD-HH24MISS') || '-' || upper(substr(replace(v_order_id::text, '-', ''), 1, 4));

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    if v_quantity <= 0 or v_quantity > 20 then raise exception 'Invalid quantity'; end if;
    select * into v_product from public.products where id = (v_item ->> 'product_id')::uuid and is_active for update;
    if not found then raise exception 'Product unavailable'; end if;
    if v_product.stock_quantity - v_product.reserved_quantity < v_quantity then raise exception 'Insufficient stock for %', v_product.sku; end if;
    v_subtotal := v_subtotal + (v_product.price_thb * v_quantity);
  end loop;

  insert into public.orders (id, order_number, user_id, customer_name, customer_phone, shipping_country, shipping_address, shipping_city, postal_code, currency, exchange_rate_from_thb, subtotal_thb, shipping_fee_thb, total_thb, status, payment_method)
  values (v_order_id, v_order_number, auth.uid(), trim(p_customer_name), trim(p_customer_phone), p_shipping_country, trim(p_shipping_address), trim(p_shipping_city), trim(p_postal_code), 'THB', 1, v_subtotal, v_shipping, case when v_shipping is null then null else v_subtotal + v_shipping end, case when p_shipping_country = 'TH' then 'waiting_payment' else 'shipping_quote' end, case when p_shipping_country = 'TH' then 'bank_transfer' else 'western_union' end);

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    select * into v_product from public.products where id = (v_item ->> 'product_id')::uuid for update;
    insert into public.order_items (order_id, product_id, product_name_snapshot, sku_snapshot, quantity, unit_price_thb, total_price_thb)
    values (v_order_id, v_product.id, v_product.name_en, v_product.sku, v_quantity, v_product.price_thb, v_product.price_thb * v_quantity);
    update public.products set reserved_quantity = reserved_quantity + v_quantity, updated_at = now() where id = v_product.id;
  end loop;

  return query select v_order_id, v_order_number;
end;
$$;

revoke execute on function public.create_customer_order(text, text, text, text, text, text, jsonb) from public, anon;
grant execute on function public.create_customer_order(text, text, text, text, text, text, jsonb) to authenticated;
