begin;

alter table public.stock_movements add column if not exists note text;

create table if not exists public.shipping_carriers (
  id bigint generated always as identity primary key,
  name text not null unique,
  tracking_url_template text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.shipping_carriers(name, tracking_url_template, sort_order) values
  ('Thailand Post', 'https://track.thailandpost.co.th/', 10),
  ('Kerry Express', 'https://th.kerryexpress.com/th/track/', 20),
  ('Flash Express', 'https://flashexpress.com/th/fle/tracking', 30),
  ('DHL Express', 'https://www.dhl.com/th-en/home/tracking.html', 40)
on conflict (name) do nothing;

alter table public.shipping_carriers enable row level security;
drop policy if exists "admins manage shipping carriers" on public.shipping_carriers;
create policy "admins manage shipping carriers" on public.shipping_carriers for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.admin_adjust_stock(
  p_product_id uuid,
  p_quantity integer,
  p_direction text,
  p_reason text,
  p_note text
)
returns void language plpgsql security definer set search_path = '' as $$
declare v_delta integer;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_quantity is null or p_quantity not between 1 and 100000 then raise exception 'Quantity must be between 1 and 100000'; end if;
  if p_direction not in ('in','out') then raise exception 'Invalid stock direction'; end if;
  if coalesce(char_length(trim(p_reason)),0) not between 1 and 80 then raise exception 'Stock reason is required'; end if;
  if coalesce(char_length(trim(coalesce(p_note,''))),0) > 300 then raise exception 'Stock note is too long'; end if;
  v_delta := case when p_direction = 'in' then p_quantity else -p_quantity end;
  perform pg_catalog.set_config('app.stock_reason', trim(p_reason), true);
  update public.products
  set stock_quantity = stock_quantity + v_delta, updated_at = now()
  where id = p_product_id and is_active and stock_quantity + v_delta >= reserved_quantity;
  if not found then raise exception 'Active product not found or available stock is insufficient'; end if;
  update public.stock_movements set note = nullif(trim(coalesce(p_note,'')),'')
  where id = (select id from public.stock_movements where product_id = p_product_id order by created_at desc, id desc limit 1);
end;
$$;

alter table public.product_images drop constraint if exists product_images_product_id_sort_order_key;
alter table public.product_images add constraint product_images_product_id_sort_order_key
  unique(product_id, sort_order) deferrable initially immediate;

create or replace function public.admin_reorder_product_images(p_product_id uuid, p_image_ids uuid[])
returns void language plpgsql security definer set search_path = '' as $$
declare v_count integer; v_image_id uuid; v_index integer := 0;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  v_count := coalesce(array_length(p_image_ids, 1), 0);
  if v_count not between 1 and 5 then raise exception 'Image order must contain between 1 and 5 images'; end if;
  if (select count(*) from public.product_images where product_id = p_product_id and id = any(p_image_ids)) <> v_count
    or (select count(*) from public.product_images where product_id = p_product_id) <> v_count then
    raise exception 'Image list does not match product images';
  end if;
  set constraints product_images_product_id_sort_order_key deferred;
  foreach v_image_id in array p_image_ids loop
    v_index := v_index + 1;
    update public.product_images set sort_order = v_index where id = v_image_id and product_id = p_product_id;
  end loop;
end;
$$;

create or replace function public.admin_save_shipping_carrier(p_id bigint, p_name text, p_tracking_url_template text)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_id bigint;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if coalesce(char_length(trim(p_name)),0) not between 1 and 120 then raise exception 'Carrier name is required'; end if;
  if coalesce(char_length(trim(coalesce(p_tracking_url_template,''))),0) > 500 then raise exception 'Tracking URL is too long'; end if;
  if p_id is null then
    insert into public.shipping_carriers(name, tracking_url_template, sort_order)
    values(trim(p_name), trim(coalesce(p_tracking_url_template,'')), coalesce((select max(sort_order)+10 from public.shipping_carriers),10)) returning id into v_id;
  else
    update public.shipping_carriers set name=trim(p_name), tracking_url_template=trim(coalesce(p_tracking_url_template,'')), updated_at=now() where id=p_id returning id into v_id;
  end if;
  return v_id;
end;
$$;

create or replace function public.admin_delete_shipping_carrier(p_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  delete from public.shipping_carriers where id = p_id;
end;
$$;

grant select, insert, update, delete on public.shipping_carriers to authenticated;
grant usage, select on sequence public.shipping_carriers_id_seq to authenticated;
revoke execute on function public.admin_adjust_stock(uuid,integer,text,text,text) from public, anon;
revoke execute on function public.admin_reorder_product_images(uuid,uuid[]) from public, anon;
revoke execute on function public.admin_save_shipping_carrier(bigint,text,text) from public, anon;
revoke execute on function public.admin_delete_shipping_carrier(bigint) from public, anon;
grant execute on function public.admin_adjust_stock(uuid,integer,text,text,text), public.admin_reorder_product_images(uuid,uuid[]), public.admin_save_shipping_carrier(bigint,text,text), public.admin_delete_shipping_carrier(bigint) to authenticated;

notify pgrst, 'reload schema';
commit;
