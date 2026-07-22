begin;

insert into public.app_settings(key, value)
values (
  'western_union',
  jsonb_build_object(
    'payment_method', 'Western Union',
    'bank_name', 'Krungsri Bank',
    'account_number', '0801960697',
    'receiver_name', 'Miss Jutharat Innarong',
    'receiver_address', '14/6 Moo 5, Berk Phrai Subdistrict, Ban Pong District, Ratchaburi Province.',
    'country', 'Thailand',
    'city', 'Ratchaburi Province',
    'phone', '',
    'instructions', ''
  )
)
on conflict (key) do update set value = excluded.value;

update public.orders
set payment_instructions = (select value from public.app_settings where key = 'western_union'),
    updated_at = now()
where payment_method = 'western_union'
  and status in ('shipping_quote', 'waiting_payment');

notify pgrst, 'reload schema';
commit;
