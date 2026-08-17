-- Fix product images deferrable unique constraint and search_path in admin_reorder_product_images

alter table public.product_images drop constraint if exists product_images_product_id_sort_order_key;
alter table public.product_images add constraint product_images_product_id_sort_order_key
  unique(product_id, sort_order) deferrable initially immediate;

create or replace function public.admin_reorder_product_images(p_product_id uuid, p_image_ids uuid[])
returns void language plpgsql security definer set search_path = 'public', 'pg_temp' as $$
declare
  v_count integer;
  v_image_id uuid;
  v_index integer := 0;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  v_count := coalesce(array_length(p_image_ids, 1), 0);
  if v_count not between 1 and 5 then raise exception 'Image order must contain between 1 and 5 images'; end if;
  if (select count(*) from public.product_images where product_id = p_product_id and id = any(p_image_ids)) <> v_count
    or (select count(*) from public.product_images where product_id = p_product_id) <> v_count then
    raise exception 'Image list does not match product images';
  end if;

  set constraints all deferred;

  foreach v_image_id in array p_image_ids loop
    v_index := v_index + 1;
    update public.product_images set sort_order = v_index where id = v_image_id and product_id = p_product_id;
  end loop;
end;
$$;

revoke execute on function public.admin_reorder_product_images(uuid,uuid[]) from public, anon;
grant execute on function public.admin_reorder_product_images(uuid,uuid[]) to authenticated;

notify pgrst, 'reload schema';
