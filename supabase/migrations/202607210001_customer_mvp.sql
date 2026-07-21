begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  preferred_language text not null default 'en' check (preferred_language in ('en', 'th')),
  country_code text not null default 'TH' check (country_code in ('TH', 'AT', 'AU', 'PH', 'AE', 'IN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name_en text not null,
  name_th text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.brands (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.vehicle_models (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  slug text not null unique,
  name_en text not null,
  name_th text not null,
  description_en text not null default '',
  description_th text not null default '',
  price_thb numeric(12,2) not null check (price_thb >= 0),
  weight_grams integer not null default 0 check (weight_grams >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  reserved_quantity integer not null default 0 check (reserved_quantity >= 0 and reserved_quantity <= stock_quantity),
  status text not null default 'in_stock' check (status in ('in_stock', 'low_stock', 'out_of_stock', 'coming_soon')),
  category_id bigint references public.categories(id),
  brand_id bigint references public.brands(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  sort_order smallint not null check (sort_order between 1 and 5),
  created_at timestamptz not null default now(),
  unique (product_id, sort_order)
);

create table if not exists public.product_vehicle_fitments (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  vehicle_model_id bigint not null references public.vehicle_models(id),
  year_from smallint not null check (year_from between 1900 and 2100),
  year_to smallint not null check (year_to between 1900 and 2100 and year_to >= year_from),
  unique (product_id, vehicle_model_id, year_from, year_to)
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references auth.users(id),
  customer_name text not null,
  customer_phone text not null,
  shipping_country text not null check (shipping_country in ('TH', 'AT', 'AU', 'PH', 'AE', 'IN')),
  shipping_address text not null,
  shipping_city text not null,
  postal_code text not null,
  currency text not null check (currency in ('THB', 'EUR', 'AUD', 'PHP', 'AED', 'INR')),
  exchange_rate_from_thb numeric(16,6) not null check (exchange_rate_from_thb > 0),
  subtotal_thb numeric(12,2) not null check (subtotal_thb >= 0),
  shipping_fee_thb numeric(12,2) check (shipping_fee_thb is null or shipping_fee_thb >= 0),
  total_thb numeric(12,2) check (total_thb is null or total_thb >= 0),
  status text not null check (status in ('shipping_quote', 'waiting_payment', 'payment_submitted', 'paid', 'preparing', 'shipped', 'cancelled')),
  payment_method text not null check (payment_method in ('bank_transfer', 'western_union')),
  shipping_company text,
  tracking_number text,
  cancelled_at timestamptz,
  reservation_expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  product_name_snapshot text not null,
  sku_snapshot text not null,
  quantity integer not null check (quantity > 0),
  unit_price_thb numeric(12,2) not null check (unit_price_thb >= 0),
  total_price_thb numeric(12,2) not null check (total_price_thb >= 0)
);

create table if not exists public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  storage_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  uploaded_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

create table if not exists public.exchange_rates (
  currency text primary key check (currency in ('THB', 'EUR', 'AUD', 'PHP', 'AED', 'INR')),
  rate_from_thb numeric(16,6) not null check (rate_from_thb > 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category_id) where is_active;
create index if not exists products_brand_idx on public.products(brand_id) where is_active;
create index if not exists fitments_model_year_idx on public.product_vehicle_fitments(vehicle_model_id, year_from, year_to);
create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);
create index if not exists orders_status_created_idx on public.orders(status, created_at desc);
create index if not exists orders_reservation_expiry_idx on public.orders(reservation_expires_at) where status in ('shipping_quote', 'waiting_payment');
create index if not exists order_items_order_idx on public.order_items(order_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    case when lower(coalesce(new.email, '')) = 'masterbean9@gmail.com' then 'admin' else 'customer' end
  )
  on conflict (id) do update set email = excluded.email, name = excluded.name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, email, name, role)
select id, coalesce(email, ''), coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name', ''),
  case when lower(coalesce(email, '')) = 'masterbean9@gmail.com' then 'admin' else 'customer' end
from auth.users
on conflict (id) do update set email = excluded.email, name = excluded.name,
  role = case when lower(excluded.email) = 'masterbean9@gmail.com' then 'admin' else public.profiles.role end;

insert into public.categories (slug, name_en, name_th) values
  ('brake-clutch-lines', 'Brake & Clutch Lines', 'สายเบรกและสายคลัตช์'),
  ('handlebars', 'Handlebars', 'แฮนด์'),
  ('fenders', 'Fenders', 'บังโคลน'),
  ('wheels', 'Wheels', 'ชุดล้อ'),
  ('lighting-electrical', 'Lighting & Electrical', 'ระบบไฟและอุปกรณ์ไฟแต่ง'),
  ('engine-guards', 'Engine Guards', 'การ์ดเครื่อง'),
  ('seats', 'Seats', 'เบาะ'),
  ('exhausts', 'Exhausts', 'ท่อไอเสีย'),
  ('carbon-parts', 'Carbon Parts', 'พาร์ตคาร์บอน')
on conflict (slug) do update set name_en = excluded.name_en, name_th = excluded.name_th;

insert into public.brands (slug, name) values
  ('motogadget', 'Motogadget'), ('zard-exhaust', 'ZARD Exhaust'),
  ('hercules-exhaust', 'Hercules Exhaust'), ('beringer-brake', 'Beringer Brake'),
  ('piaa', 'PIAA'), ('baja', 'Baja'), ('pucycles', 'PUCYCLES')
on conflict (slug) do update set name = excluded.name;

insert into public.vehicle_models (slug, name) values
  ('triumph-t100-t120', 'Triumph T100-T120'),
  ('triumph-bobber-1200', 'Triumph Bobber 1200'),
  ('triumph-thruxton-r1200', 'Triumph Thruxton R1200')
on conflict (slug) do update set name = excluded.name;

insert into public.exchange_rates (currency, rate_from_thb) values
  ('THB', 1), ('EUR', 0.026), ('AUD', 0.043), ('PHP', 1.66), ('AED', 0.108), ('INR', 2.47)
on conflict (currency) do update set rate_from_thb = excluded.rate_from_thb, updated_at = now();

insert into public.app_settings (key, value) values
  ('thai_shipping_fee_thb', '120'::jsonb),
  ('bank_transfer', '{"account_name":"PUCYCLES","bank":"","account_number":""}'::jsonb),
  ('western_union', '{"receiver_name":"","country":"Thailand"}'::jsonb)
on conflict (key) do nothing;

create or replace function public.release_expired_order_reservations()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order record;
  v_released integer := 0;
begin
  for v_order in
    select id
    from public.orders
    where status in ('shipping_quote', 'waiting_payment')
      and reservation_expires_at <= now()
    for update skip locked
  loop
    update public.products p
    set reserved_quantity = greatest(0, p.reserved_quantity - oi.quantity), updated_at = now()
    from public.order_items oi
    where oi.order_id = v_order.id and oi.product_id = p.id;

    update public.orders
    set status = 'cancelled', cancelled_at = now(), updated_at = now()
    where id = v_order.id;
    v_released := v_released + 1;
  end loop;

  return v_released;
end;
$$;

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
  v_currency text;
  v_rate numeric(16,6);
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

  v_currency := case p_shipping_country when 'TH' then 'THB' when 'AT' then 'EUR' when 'AU' then 'AUD' when 'PH' then 'PHP' when 'AE' then 'AED' else 'INR' end;
  select rate_from_thb into v_rate from public.exchange_rates where currency = v_currency;
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
  values (v_order_id, v_order_number, auth.uid(), trim(p_customer_name), trim(p_customer_phone), p_shipping_country, trim(p_shipping_address), trim(p_shipping_city), trim(p_postal_code), v_currency, v_rate, v_subtotal, v_shipping, case when v_shipping is null then null else v_subtotal + v_shipping end, case when p_shipping_country = 'TH' then 'waiting_payment' else 'shipping_quote' end, case when p_shipping_country = 'TH' then 'bank_transfer' else 'western_union' end);

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

create or replace function public.cancel_customer_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or (v_order.user_id <> auth.uid() and not public.is_admin()) then raise exception 'Order not found'; end if;
  if v_order.status not in ('shipping_quote', 'waiting_payment') then raise exception 'Order can no longer be cancelled'; end if;
  update public.products p set reserved_quantity = greatest(0, p.reserved_quantity - oi.quantity), updated_at = now()
  from public.order_items oi where oi.order_id = v_order.id and oi.product_id = p.id;
  update public.orders set status = 'cancelled', cancelled_at = now(), reservation_expires_at = now(), updated_at = now() where id = v_order.id;
end;
$$;

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
  update public.orders
  set customer_name = trim(p_customer_name), customer_phone = trim(p_customer_phone),
      shipping_address = trim(p_shipping_address), shipping_city = trim(p_shipping_city),
      postal_code = trim(p_postal_code), updated_at = now()
  where id = p_order_id and user_id = auth.uid() and status in ('shipping_quote', 'waiting_payment');
  if not found then raise exception 'Order can no longer be edited'; end if;
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
  on conflict (order_id) do update set storage_path = excluded.storage_path, status = 'pending', uploaded_at = now(), reviewed_at = null, reviewed_by = null
  returning id into v_proof_id;
  update public.orders set status = 'payment_submitted', updated_at = now() where id = p_order_id;
  return v_proof_id;
end;
$$;

create or replace function public.admin_set_shipping_quote(p_order_id uuid, p_shipping_fee_thb numeric)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_shipping_fee_thb < 0 then raise exception 'Invalid shipping fee'; end if;
  update public.orders set shipping_fee_thb = p_shipping_fee_thb,
    total_thb = subtotal_thb + p_shipping_fee_thb,
    status = 'waiting_payment', reservation_expires_at = now() + interval '3 days', updated_at = now()
  where id = p_order_id and status = 'shipping_quote';
  if not found then raise exception 'Order is not waiting for a shipping quote'; end if;
end;
$$;

create or replace function public.admin_confirm_payment(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if not exists (select 1 from public.orders where id = p_order_id and status = 'payment_submitted' for update) then
    raise exception 'Order is not waiting for payment review';
  end if;
  update public.products p
  set stock_quantity = p.stock_quantity - oi.quantity,
      reserved_quantity = greatest(0, p.reserved_quantity - oi.quantity),
      updated_at = now()
  from public.order_items oi where oi.order_id = p_order_id and oi.product_id = p.id;
  update public.payment_proofs set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid() where order_id = p_order_id;
  update public.orders set status = 'paid', reservation_expires_at = now(), updated_at = now() where id = p_order_id;
end;
$$;

create or replace function public.admin_mark_shipped(p_order_id uuid, p_shipping_company text, p_tracking_number text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  update public.orders set status = 'shipped', shipping_company = trim(p_shipping_company),
    tracking_number = trim(p_tracking_number), updated_at = now()
  where id = p_order_id and status in ('paid', 'preparing');
  if not found then raise exception 'Order is not ready to ship'; end if;
end;
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.vehicle_models enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_vehicle_fitments enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_proofs enable row level security;
alter table public.exchange_rates enable row level security;
alter table public.app_settings enable row level security;

create policy "profiles own or admin select" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles own or admin update" on public.profiles for update to authenticated using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy "reference data public read" on public.categories for select to anon, authenticated using (true);
create policy "brands public read" on public.brands for select to anon, authenticated using (true);
create policy "models public read" on public.vehicle_models for select to anon, authenticated using (true);
create policy "active products public read" on public.products for select to anon, authenticated using (is_active);
create policy "product images public read" on public.product_images for select to anon, authenticated using (true);
create policy "fitments public read" on public.product_vehicle_fitments for select to anon, authenticated using (true);
create policy "admin manages categories" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin manages brands" on public.brands for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin manages models" on public.vehicle_models for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin manages products" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin manages product images" on public.product_images for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin manages fitments" on public.product_vehicle_fitments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "users manage own cart" on public.carts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users manage own cart items" on public.cart_items for all to authenticated using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())) with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));
create policy "orders own or admin read" on public.orders for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "admin updates orders" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "order items own or admin read" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
create policy "proofs own or admin read" on public.payment_proofs for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "admin updates proofs" on public.payment_proofs for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "rates public read" on public.exchange_rates for select to anon, authenticated using (true);
create policy "admin manages rates" on public.exchange_rates for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "settings authenticated read" on public.app_settings for select to authenticated using (true);
create policy "admin manages settings" on public.app_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 10485760, array['image/jpeg','image/png','image/webp']),
  ('payment-proofs', 'payment-proofs', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "product image files public read" on storage.objects for select to anon, authenticated using (bucket_id = 'product-images');
create policy "admin uploads product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
create policy "admin updates product images" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.is_admin()) with check (bucket_id = 'product-images' and public.is_admin());
create policy "admin deletes product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());
create policy "users upload own payment proofs" on storage.objects for insert to authenticated with check (
  bucket_id = 'payment-proofs'
  and owner_id = auth.uid()::text
  and (storage.foldername(name))[1] = auth.uid()::text
  and (storage.foldername(name))[3] is null
  and storage.filename(name) = 'receipt'
  and exists (
    select 1 from public.orders o
    where o.id::text = (storage.foldername(name))[2]
      and o.user_id = auth.uid()
      and o.status = 'waiting_payment'
  )
);
create policy "users read own payment proofs" on storage.objects for select to authenticated using (
  bucket_id = 'payment-proofs' and (owner_id = auth.uid()::text or public.is_admin())
);
create policy "users delete unsubmitted payment proofs" on storage.objects for delete to authenticated using (
  bucket_id = 'payment-proofs'
  and owner_id = auth.uid()::text
  and storage.filename(name) = 'receipt'
  and exists (
    select 1 from public.orders o
    where o.id::text = (storage.foldername(name))[2]
      and o.user_id = auth.uid()
      and o.status = 'waiting_payment'
  )
);
create policy "admin deletes payment proofs" on storage.objects for delete to authenticated using (bucket_id = 'payment-proofs' and public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.brands, public.vehicle_models, public.products, public.product_images, public.product_vehicle_fitments, public.exchange_rates to anon;
grant select, insert, update, delete on public.categories, public.brands, public.vehicle_models, public.products, public.product_images, public.product_vehicle_fitments, public.exchange_rates to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant select on public.profiles to authenticated;
grant update (name, preferred_language, country_code, updated_at) on public.profiles to authenticated;
grant select, insert, update, delete on public.carts, public.cart_items to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant select, update on public.payment_proofs to authenticated;
grant select, insert, update, delete on public.app_settings to authenticated;

revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.release_expired_order_reservations() from public, anon, authenticated;
revoke execute on function public.create_customer_order(text, text, text, text, text, text, jsonb) from public, anon;
revoke execute on function public.cancel_customer_order(uuid) from public, anon;
revoke execute on function public.update_customer_order_address(uuid, text, text, text, text, text) from public, anon;
revoke execute on function public.submit_payment_proof(uuid, text) from public, anon;
revoke execute on function public.admin_set_shipping_quote(uuid, numeric) from public, anon;
revoke execute on function public.admin_confirm_payment(uuid) from public, anon;
revoke execute on function public.admin_mark_shipped(uuid, text, text) from public, anon;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.create_customer_order(text, text, text, text, text, text, jsonb) to authenticated;
grant execute on function public.cancel_customer_order(uuid) to authenticated;
grant execute on function public.update_customer_order_address(uuid, text, text, text, text, text) to authenticated;
grant execute on function public.submit_payment_proof(uuid, text) to authenticated;
grant execute on function public.admin_set_shipping_quote(uuid, numeric) to authenticated;
grant execute on function public.admin_confirm_payment(uuid) to authenticated;
grant execute on function public.admin_mark_shipped(uuid, text, text) to authenticated;

commit;
