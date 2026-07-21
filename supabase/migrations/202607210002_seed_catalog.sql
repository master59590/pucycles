begin;

insert into public.products (
  id, sku, slug, name_en, name_th, description_en, description_th,
  price_thb, weight_grams, stock_quantity, reserved_quantity, status,
  category_id, brand_id, is_active
)
values
  (
    '00000000-0000-4000-8000-000000000001', 'PC-001', 'zard-2-1-full-exhaust',
    'ZARD 2-1 Full Exhaust System', 'ZARD 2-1 Full Exhaust System',
    'A complete stainless steel exhaust system tuned for a deeper tone, reduced weight, and clean modern-classic lines.',
    'A complete stainless steel exhaust system tuned for a deeper tone, reduced weight, and clean modern-classic lines.',
    42500, 6200, 6, 0, 'in_stock',
    (select id from public.categories where slug = 'exhausts'),
    (select id from public.brands where slug = 'zard-exhaust'), true
  ),
  (
    '00000000-0000-4000-8000-000000000002', 'PC-002', 'motogadget-motoscope-mini',
    'Motogadget Motoscope Mini', 'Motogadget Motoscope Mini',
    'Compact digital instrument with a crisp LED display for stripped-back custom cockpit builds.',
    'Compact digital instrument with a crisp LED display for stripped-back custom cockpit builds.',
    13900, 180, 2, 0, 'low_stock',
    (select id from public.categories where slug = 'lighting-electrical'),
    (select id from public.brands where slug = 'motogadget'), true
  ),
  (
    '00000000-0000-4000-8000-000000000003', 'PC-003', 'beringer-front-brake-kit',
    'Beringer Front Brake Kit', 'Beringer Front Brake Kit',
    'High-performance front braking package with progressive lever feel and precise control.',
    'High-performance front braking package with progressive lever feel and precise control.',
    38400, 3100, 4, 0, 'in_stock',
    (select id from public.categories where slug = 'brake-clutch-lines'),
    (select id from public.brands where slug = 'beringer-brake'), true
  ),
  (
    '00000000-0000-4000-8000-000000000004', 'PC-004', 'handcrafted-ribbed-seat',
    'Handcrafted Ribbed Seat', 'Handcrafted Ribbed Seat',
    'Hand-shaped seat with ribbed upholstery, designed to preserve the Bobber low profile.',
    'Hand-shaped seat with ribbed upholstery, designed to preserve the Bobber low profile.',
    8900, 2200, 0, 0, 'coming_soon',
    (select id from public.categories where slug = 'seats'),
    (select id from public.brands where slug = 'pucycles'), true
  ),
  (
    '00000000-0000-4000-8000-000000000005', 'PC-005', 'carbon-front-fender',
    'Carbon Front Fender', 'Carbon Front Fender',
    'Lightweight carbon-fibre front fender with a gloss finish and direct-fit mounting points.',
    'Lightweight carbon-fibre front fender with a gloss finish and direct-fit mounting points.',
    11200, 620, 0, 0, 'out_of_stock',
    (select id from public.categories where slug = 'carbon-parts'),
    (select id from public.brands where slug = 'pucycles'), true
  ),
  (
    '00000000-0000-4000-8000-000000000006', 'PC-006', 'baja-led-auxiliary-light-kit',
    'Baja LED Auxiliary Light Kit', 'Baja LED Auxiliary Light Kit',
    'Compact high-output auxiliary lights for confident night riding and poor-weather visibility.',
    'Compact high-output auxiliary lights for confident night riding and poor-weather visibility.',
    15900, 940, 8, 0, 'in_stock',
    (select id from public.categories where slug = 'lighting-electrical'),
    (select id from public.brands where slug = 'baja'), true
  )
on conflict (id) do update set
  sku = excluded.sku,
  slug = excluded.slug,
  name_en = excluded.name_en,
  name_th = excluded.name_th,
  description_en = excluded.description_en,
  description_th = excluded.description_th,
  price_thb = excluded.price_thb,
  weight_grams = excluded.weight_grams,
  stock_quantity = excluded.stock_quantity,
  status = excluded.status,
  category_id = excluded.category_id,
  brand_id = excluded.brand_id,
  is_active = excluded.is_active,
  updated_at = now();

delete from public.product_vehicle_fitments
where product_id in (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000004',
  '00000000-0000-4000-8000-000000000005',
  '00000000-0000-4000-8000-000000000006'
);

insert into public.product_vehicle_fitments (product_id, vehicle_model_id, year_from, year_to)
select fit.product_id::uuid, vm.id, fit.year_from, fit.year_to
from (values
  ('00000000-0000-4000-8000-000000000001', 'triumph-t100-t120', 2016, 2026),
  ('00000000-0000-4000-8000-000000000001', 'triumph-thruxton-r1200', 2016, 2026),
  ('00000000-0000-4000-8000-000000000002', 'triumph-bobber-1200', 2017, 2026),
  ('00000000-0000-4000-8000-000000000002', 'triumph-t100-t120', 2017, 2026),
  ('00000000-0000-4000-8000-000000000003', 'triumph-thruxton-r1200', 2016, 2020),
  ('00000000-0000-4000-8000-000000000004', 'triumph-bobber-1200', 2017, 2026),
  ('00000000-0000-4000-8000-000000000005', 'triumph-t100-t120', 2016, 2026),
  ('00000000-0000-4000-8000-000000000005', 'triumph-thruxton-r1200', 2016, 2026),
  ('00000000-0000-4000-8000-000000000006', 'triumph-t100-t120', 2016, 2026),
  ('00000000-0000-4000-8000-000000000006', 'triumph-bobber-1200', 2016, 2026)
) as fit(product_id, model_slug, year_from, year_to)
join public.vehicle_models vm on vm.slug = fit.model_slug;

commit;
