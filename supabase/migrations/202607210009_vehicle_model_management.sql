begin;

create or replace function public.admin_save_vehicle_model(
  p_vehicle_model_id bigint,
  p_name text
)
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
  if coalesce(char_length(trim(p_name)), 0) not between 1 and 120 then
    raise exception 'Vehicle model name is required';
  end if;

  if p_vehicle_model_id is null then
    v_slug_base := trim(both '-' from regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g'));
    if v_slug_base = '' then raise exception 'Vehicle model name must contain letters or numbers'; end if;
    v_slug := v_slug_base;
    while exists (select 1 from public.vehicle_models where slug = v_slug) loop
      v_suffix := v_suffix + 1;
      v_slug := v_slug_base || '-' || v_suffix::text;
    end loop;

    insert into public.vehicle_models (slug, name)
    values (v_slug, trim(p_name))
    returning id into v_id;
  else
    update public.vehicle_models
    set name = trim(p_name)
    where id = p_vehicle_model_id;
    if not found then raise exception 'Vehicle model not found'; end if;
    v_id := p_vehicle_model_id;
  end if;

  return v_id;
end;
$$;

create or replace function public.admin_delete_vehicle_model(p_vehicle_model_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if exists (
    select 1 from public.product_vehicle_fitments
    where vehicle_model_id = p_vehicle_model_id
  ) then
    raise exception 'Vehicle model is in use and cannot be deleted';
  end if;

  delete from public.vehicle_models where id = p_vehicle_model_id;
  if not found then raise exception 'Vehicle model not found'; end if;
end;
$$;

revoke execute on function public.admin_save_vehicle_model(bigint, text) from public, anon;
revoke execute on function public.admin_delete_vehicle_model(bigint) from public, anon;
grant execute on function public.admin_save_vehicle_model(bigint, text) to authenticated;
grant execute on function public.admin_delete_vehicle_model(bigint) to authenticated;

notify pgrst, 'reload schema';

commit;
