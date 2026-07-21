begin;

create or replace function public.derive_stock_status(
  p_stock_quantity integer,
  p_reserved_quantity integer
)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_stock_quantity <= p_reserved_quantity then 'out_of_stock'
    when p_stock_quantity - p_reserved_quantity <= 2 then 'low_stock'
    else 'in_stock'
  end;
$$;

create or replace function public.set_product_stock_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.status := public.derive_stock_status(new.stock_quantity, new.reserved_quantity);
  return new;
end;
$$;

drop trigger if exists set_product_stock_status_trigger on public.products;
create trigger set_product_stock_status_trigger
before insert or update of stock_quantity, reserved_quantity, status on public.products
for each row execute function public.set_product_stock_status();

update public.products
set status = public.derive_stock_status(stock_quantity, reserved_quantity),
    updated_at = now()
where status is distinct from public.derive_stock_status(stock_quantity, reserved_quantity);

alter table public.products drop constraint if exists products_status_check;
alter table public.products add constraint products_status_check
  check (status in ('in_stock', 'low_stock', 'out_of_stock'));

drop function if exists public.admin_save_product_v2(
  uuid, text, text, text, text, numeric, integer, integer, text, bigint, bigint, jsonb
);
drop function if exists public.admin_save_product_v2(
  uuid, text, text, text, text, numeric, integer, integer, bigint, bigint, jsonb
);

create function public.admin_save_product_v2(
  p_product_id uuid,
  p_name_en text,
  p_name_th text,
  p_description_en text,
  p_description_th text,
  p_price_thb numeric,
  p_weight_grams integer,
  p_stock_quantity integer,
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
  v_reserved_quantity integer := 0;
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
    select sku, slug, reserved_quantity
    into v_sku, v_slug, v_reserved_quantity
    from public.products
    where id = p_product_id;
    if not found then raise exception 'Product not found'; end if;
  end if;

  return public.admin_save_product(
    p_product_id, v_sku, v_slug, p_name_en, p_name_th, p_description_en, p_description_th,
    p_price_thb, p_weight_grams, p_stock_quantity,
    public.derive_stock_status(p_stock_quantity, v_reserved_quantity),
    p_category_id, p_brand_id, p_fitments
  );
end;
$$;

revoke execute on function public.derive_stock_status(integer, integer) from public, anon, authenticated;
revoke execute on function public.set_product_stock_status() from public, anon, authenticated;
revoke execute on function public.admin_save_product_v2(uuid, text, text, text, text, numeric, integer, integer, bigint, bigint, jsonb) from public, anon;
grant execute on function public.admin_save_product_v2(uuid, text, text, text, text, numeric, integer, integer, bigint, bigint, jsonb) to authenticated;

notify pgrst, 'reload schema';

commit;
