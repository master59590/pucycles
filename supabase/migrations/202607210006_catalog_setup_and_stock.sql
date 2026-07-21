begin;

create sequence if not exists public.product_sku_seq start 1;

do $$
declare
  v_max_sku bigint;
  v_sequence_value bigint;
  v_sequence_called boolean;
begin
  select max(substring(sku from '^PUC-([0-9]+)$')::bigint)
  into v_max_sku
  from public.products
  where sku ~ '^PUC-[0-9]+$';
  select last_value, is_called into v_sequence_value, v_sequence_called from public.product_sku_seq;
  if v_max_sku is not null and (v_max_sku > v_sequence_value or not v_sequence_called) then
    perform setval('public.product_sku_seq', v_max_sku, true);
  end if;
end;
$$;

create or replace function public.admin_save_product_v2(
  p_product_id uuid,
  p_name_en text,
  p_name_th text,
  p_description_en text,
  p_description_th text,
  p_price_thb numeric,
  p_weight_grams integer,
  p_stock_quantity integer,
  p_status text,
  p_category_id bigint,
  p_brand_id bigint,
  p_fitments jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sku text;
  v_slug text;
  v_slug_base text;
  v_suffix integer := 1;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;

  if p_product_id is null then
    v_sku := 'PUC-' || lpad(nextval('public.product_sku_seq')::text, 4, '0');
    v_slug_base := trim(both '-' from regexp_replace(lower(trim(p_name_en)), '[^a-z0-9]+', '-', 'g'));
    if v_slug_base = '' then v_slug_base := lower(v_sku); end if;
    v_slug := v_slug_base;
    while exists (select 1 from public.products where slug = v_slug) loop
      v_suffix := v_suffix + 1;
      v_slug := v_slug_base || '-' || v_suffix::text;
    end loop;
  else
    select sku, slug into v_sku, v_slug from public.products where id = p_product_id;
    if not found then raise exception 'Product not found'; end if;
  end if;

  return public.admin_save_product(
    p_product_id, v_sku, v_slug, p_name_en, p_name_th, p_description_en, p_description_th,
    p_price_thb, p_weight_grams, p_stock_quantity, p_status, p_category_id, p_brand_id, p_fitments
  );
end;
$$;

create or replace function public.admin_save_category(p_category_id bigint, p_name_en text, p_name_th text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
  v_slug text;
  v_slug_base text;
  v_suffix integer := 1;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if coalesce(char_length(trim(p_name_en)), 0) not between 1 and 120
    or coalesce(char_length(trim(p_name_th)), 0) not between 1 and 120
  then raise exception 'English and Thai category names are required'; end if;

  if p_category_id is null then
    v_slug_base := trim(both '-' from regexp_replace(lower(trim(p_name_en)), '[^a-z0-9]+', '-', 'g'));
    if v_slug_base = '' then raise exception 'English category name must contain letters or numbers'; end if;
    v_slug := v_slug_base;
    while exists (select 1 from public.categories where slug = v_slug) loop
      v_suffix := v_suffix + 1;
      v_slug := v_slug_base || '-' || v_suffix::text;
    end loop;
    insert into public.categories (slug, name_en, name_th)
    values (v_slug, trim(p_name_en), trim(p_name_th)) returning id into v_id;
  else
    update public.categories set name_en = trim(p_name_en), name_th = trim(p_name_th) where id = p_category_id;
    if not found then raise exception 'Category not found'; end if;
    v_id := p_category_id;
  end if;
  return v_id;
end;
$$;

create or replace function public.admin_save_brand(p_brand_id bigint, p_name text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
  v_slug text;
  v_slug_base text;
  v_suffix integer := 1;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if coalesce(char_length(trim(p_name)), 0) not between 1 and 120 then raise exception 'Brand name is required'; end if;

  if p_brand_id is null then
    v_slug_base := trim(both '-' from regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g'));
    if v_slug_base = '' then raise exception 'Brand name must contain letters or numbers'; end if;
    v_slug := v_slug_base;
    while exists (select 1 from public.brands where slug = v_slug) loop
      v_suffix := v_suffix + 1;
      v_slug := v_slug_base || '-' || v_suffix::text;
    end loop;
    insert into public.brands (slug, name) values (v_slug, trim(p_name)) returning id into v_id;
  else
    update public.brands set name = trim(p_name) where id = p_brand_id;
    if not found then raise exception 'Brand not found'; end if;
    v_id := p_brand_id;
  end if;
  return v_id;
end;
$$;

create or replace function public.admin_delete_category(p_category_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if exists (select 1 from public.products where category_id = p_category_id) then
    raise exception 'Category is in use and cannot be deleted';
  end if;
  delete from public.categories where id = p_category_id;
  if not found then raise exception 'Category not found'; end if;
end;
$$;

create or replace function public.admin_delete_brand(p_brand_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if exists (select 1 from public.products where brand_id = p_brand_id) then
    raise exception 'Brand is in use and cannot be deleted';
  end if;
  delete from public.brands where id = p_brand_id;
  if not found then raise exception 'Brand not found'; end if;
end;
$$;

create table if not exists public.stock_movements (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity_before integer not null,
  quantity_after integer not null,
  quantity_delta integer not null,
  reason text not null default 'manual_adjustment',
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_product_created_idx
  on public.stock_movements(product_id, created_at desc);

create or replace function public.record_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.stock_quantity is distinct from new.stock_quantity then
    insert into public.stock_movements (product_id, quantity_before, quantity_after, quantity_delta, reason, changed_by)
    values (
      new.id,
      old.stock_quantity,
      new.stock_quantity,
      new.stock_quantity - old.stock_quantity,
      coalesce(nullif(pg_catalog.current_setting('app.stock_reason', true), ''), 'manual_adjustment'),
      auth.uid()
    );
  end if;
  return new;
end;
$$;

drop trigger if exists record_stock_movement_trigger on public.products;
create trigger record_stock_movement_trigger
after update of stock_quantity on public.products
for each row execute function public.record_stock_movement();

alter table public.stock_movements enable row level security;
drop policy if exists "admins read stock movements" on public.stock_movements;
create policy "admins read stock movements" on public.stock_movements
for select to authenticated using (public.is_admin());

create or replace function public.admin_receive_stock(p_product_id uuid, p_quantity integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_quantity is null or p_quantity not between 1 and 100000 then raise exception 'Receive quantity must be between 1 and 100000'; end if;
  perform pg_catalog.set_config('app.stock_reason', 'stock_received', true);
  update public.products
  set stock_quantity = stock_quantity + p_quantity,
      status = case when stock_quantity + p_quantity - reserved_quantity <= 2 then 'low_stock' else 'in_stock' end,
      updated_at = now()
  where id = p_product_id and is_active;
  if not found then raise exception 'Active product not found'; end if;
end;
$$;

grant select on public.stock_movements to authenticated;
revoke execute on function public.admin_save_product_v2(uuid, text, text, text, text, numeric, integer, integer, text, bigint, bigint, jsonb) from public, anon;
revoke execute on function public.admin_save_category(bigint, text, text) from public, anon;
revoke execute on function public.admin_save_brand(bigint, text) from public, anon;
revoke execute on function public.admin_delete_category(bigint) from public, anon;
revoke execute on function public.admin_delete_brand(bigint) from public, anon;
revoke execute on function public.record_stock_movement() from public, anon, authenticated;
revoke execute on function public.admin_receive_stock(uuid, integer) from public, anon;
grant execute on function public.admin_save_product_v2(uuid, text, text, text, text, numeric, integer, integer, text, bigint, bigint, jsonb) to authenticated;
grant execute on function public.admin_save_category(bigint, text, text) to authenticated;
grant execute on function public.admin_save_brand(bigint, text) to authenticated;
grant execute on function public.admin_delete_category(bigint) to authenticated;
grant execute on function public.admin_delete_brand(bigint) to authenticated;
grant execute on function public.admin_receive_stock(uuid, integer) to authenticated;

commit;
