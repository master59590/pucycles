begin;

create or replace function public.admin_save_product(
  p_product_id uuid,
  p_sku text,
  p_slug text,
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
  v_product_id uuid;
  v_fitment jsonb;
  v_model_id bigint;
  v_year_from integer;
  v_year_to integer;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if coalesce(char_length(trim(p_sku)), 0) not between 1 and 80 then raise exception 'SKU is required'; end if;
  if coalesce(char_length(trim(p_slug)), 0) not between 1 and 160
    or trim(p_slug) !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  then raise exception 'Slug must contain lowercase letters, numbers, and hyphens only'; end if;
  if coalesce(char_length(trim(p_name_en)), 0) not between 1 and 200
    or coalesce(char_length(trim(p_name_th)), 0) not between 1 and 200
  then raise exception 'English and Thai product names are required'; end if;
  if coalesce(char_length(p_description_en), 0) > 5000
    or coalesce(char_length(p_description_th), 0) > 5000
  then raise exception 'Product description is too long'; end if;
  if p_price_thb is null or p_price_thb < 0 then raise exception 'Price must be zero or greater'; end if;
  if p_weight_grams is null or p_weight_grams < 0 then raise exception 'Weight must be zero or greater'; end if;
  if p_stock_quantity is null or p_stock_quantity < 0 then raise exception 'Stock must be zero or greater'; end if;
  if p_status not in ('in_stock', 'low_stock', 'out_of_stock', 'coming_soon') then raise exception 'Invalid stock status'; end if;
  if not exists (select 1 from public.categories where id = p_category_id) then raise exception 'Category not found'; end if;
  if not exists (select 1 from public.brands where id = p_brand_id) then raise exception 'Brand not found'; end if;
  if jsonb_typeof(p_fitments) <> 'array' or jsonb_array_length(p_fitments) not between 1 and 20 then
    raise exception 'Add between 1 and 20 vehicle fitments';
  end if;

  if p_product_id is null then
    insert into public.products (
      sku, slug, name_en, name_th, description_en, description_th, price_thb,
      weight_grams, stock_quantity, status, category_id, brand_id, is_active
    ) values (
      upper(trim(p_sku)), trim(p_slug), trim(p_name_en), trim(p_name_th),
      trim(coalesce(p_description_en, '')), trim(coalesce(p_description_th, '')),
      p_price_thb, p_weight_grams, p_stock_quantity, p_status, p_category_id, p_brand_id, true
    ) returning id into v_product_id;
  else
    update public.products
    set sku = upper(trim(p_sku)), slug = trim(p_slug), name_en = trim(p_name_en), name_th = trim(p_name_th),
        description_en = trim(coalesce(p_description_en, '')), description_th = trim(coalesce(p_description_th, '')),
        price_thb = p_price_thb, weight_grams = p_weight_grams, stock_quantity = p_stock_quantity,
        status = p_status, category_id = p_category_id, brand_id = p_brand_id, updated_at = now()
    where id = p_product_id and reserved_quantity <= p_stock_quantity;
    if not found then raise exception 'Product not found or stock is below the reserved quantity'; end if;
    v_product_id := p_product_id;
    delete from public.product_vehicle_fitments where product_id = v_product_id;
  end if;

  for v_fitment in select value from jsonb_array_elements(p_fitments)
  loop
    v_model_id := (v_fitment ->> 'vehicle_model_id')::bigint;
    v_year_from := (v_fitment ->> 'year_from')::integer;
    v_year_to := (v_fitment ->> 'year_to')::integer;
    if not exists (select 1 from public.vehicle_models where id = v_model_id) then raise exception 'Vehicle model not found'; end if;
    if v_year_from not between 1900 and 2100 or v_year_to not between v_year_from and 2100 then
      raise exception 'Invalid vehicle year range';
    end if;
    insert into public.product_vehicle_fitments (product_id, vehicle_model_id, year_from, year_to)
    values (v_product_id, v_model_id, v_year_from, v_year_to);
  end loop;

  return v_product_id;
end;
$$;

create or replace function public.admin_set_product_active(p_product_id uuid, p_is_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  update public.products set is_active = p_is_active, updated_at = now() where id = p_product_id;
  if not found then raise exception 'Product not found'; end if;
end;
$$;

revoke execute on function public.admin_save_product(uuid, text, text, text, text, text, text, numeric, integer, integer, text, bigint, bigint, jsonb) from public, anon;
revoke execute on function public.admin_set_product_active(uuid, boolean) from public, anon;
grant execute on function public.admin_save_product(uuid, text, text, text, text, text, text, numeric, integer, integer, text, bigint, bigint, jsonb) to authenticated;
grant execute on function public.admin_set_product_active(uuid, boolean) to authenticated;

commit;
