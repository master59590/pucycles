begin;

create table if not exists public.admin_login_accounts (
  email text primary key check (email = lower(email) and char_length(email) between 3 and 320),
  created_at timestamptz not null default now()
);

alter table public.admin_login_accounts enable row level security;
revoke all on public.admin_login_accounts from public, anon, authenticated;

insert into public.admin_login_accounts (email)
values ('admin@pucycles.local')
on conflict (email) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_is_admin_account boolean;
begin
  v_is_admin_account := exists (
    select 1 from public.admin_login_accounts
    where email = lower(coalesce(new.email, ''))
  );

  if coalesce(new.raw_app_meta_data ->> 'provider', '') = 'email' and not v_is_admin_account then
    raise exception 'Email/password accounts are restricted to the store administrator';
  end if;

  v_role := case when v_is_admin_account then 'admin' else 'customer' end;

  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    v_role
  )
  on conflict (id) do update
  set email = excluded.email,
      name = excluded.name,
      role = excluded.role,
      updated_at = now();
  return new;
end;
$$;

update public.profiles p
set role = case when exists (
  select 1 from public.admin_login_accounts a where a.email = lower(p.email)
) then 'admin' else 'customer' end,
updated_at = now();

commit;
