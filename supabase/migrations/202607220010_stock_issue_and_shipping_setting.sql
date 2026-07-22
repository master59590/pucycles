begin;

create or replace function public.get_thai_shipping_fee()
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select (value #>> '{}')::numeric from public.app_settings where key = 'thai_shipping_fee_thb'),
    120
  );
$$;

create or replace function public.admin_set_thai_shipping_fee(p_fee_thb numeric)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_fee_thb is null or p_fee_thb < 0 or p_fee_thb > 100000 then
    raise exception 'Thai shipping fee must be between 0 and 100000';
  end if;

  insert into public.app_settings (key, value)
  values ('thai_shipping_fee_thb', to_jsonb(p_fee_thb))
  on conflict (key) do update set value = excluded.value;
end;
$$;

create or replace function public.admin_issue_stock(
  p_product_id uuid,
  p_quantity integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_quantity is null or p_quantity not between 1 and 100000 then
    raise exception 'Issue quantity must be between 1 and 100000';
  end if;

  perform pg_catalog.set_config('app.stock_reason', 'walk_in_service', true);
  update public.products
  set stock_quantity = stock_quantity - p_quantity,
      status = public.derive_stock_status(stock_quantity - p_quantity, reserved_quantity),
      updated_at = now()
  where id = p_product_id
    and is_active
    and stock_quantity - reserved_quantity >= p_quantity;

  if not found then
    raise exception 'Active product not found or available stock is insufficient';
  end if;
end;
$$;

revoke execute on function public.get_thai_shipping_fee() from public;
revoke execute on function public.admin_set_thai_shipping_fee(numeric) from public, anon;
revoke execute on function public.admin_issue_stock(uuid, integer) from public, anon;
grant execute on function public.get_thai_shipping_fee() to anon, authenticated;
grant execute on function public.admin_set_thai_shipping_fee(numeric) to authenticated;
grant execute on function public.admin_issue_stock(uuid, integer) to authenticated;

notify pgrst, 'reload schema';

commit;
