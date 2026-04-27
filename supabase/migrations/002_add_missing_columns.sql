-- HealthyHub migration: ensure the restaurants table has every column the app expects.
-- Safe to run multiple times. Each ADD COLUMN uses IF NOT EXISTS.

begin;

alter table public.restaurants
  add column if not exists description   text,
  add column if not exists image_url     text,
  add column if not exists city          text,
  add column if not exists cuisine       text,
  add column if not exists tags          text[] default '{}',
  add column if not exists uber_eats_url text,
  add column if not exists deliveroo_url text,
  add column if not exists created_at    timestamptz not null default now();

-- Make sure RLS + public read policy exist (needed for the anon key to SELECT).
alter table public.restaurants enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'restaurants'
      and policyname = 'Public can read restaurants'
  ) then
    create policy "Public can read restaurants"
      on public.restaurants
      for select
      using (true);
  end if;
end $$;

commit;

-- Optional: seed 3 sample rows if the table is empty.
-- Re-run safe: inserts only when the table has zero rows.
do $$
begin
  if (select count(*) from public.restaurants) = 0 then
    insert into public.restaurants
      (name, slug, description, image_url, city, cuisine, tags, uber_eats_url, deliveroo_url)
    values
      ('Green Bowl',     'green-bowl',
       'Seasonal grain bowls, fresh salads, and cold-pressed juices.',
       'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200',
       'Paris',  'Bowls & Salads',
       array['vegan','gluten-free','organic'],
       'https://www.ubereats.com/', 'https://deliveroo.com/'),
      ('Poke Lab',       'poke-lab',
       'Build-your-own poke bowls with sustainably sourced fish.',
       'https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200',
       'London', 'Poke',
       array['high-protein','pescatarian'],
       'https://www.ubereats.com/', 'https://deliveroo.com/'),
      ('Sprout Kitchen', 'sprout-kitchen',
       'Plant-based comfort food without the guilt.',
       'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200',
       'Berlin', 'Plant-based',
       array['vegan','low-sugar'],
       'https://www.ubereats.com/', null);
  end if;
end $$;

-- Sanity check (run separately if you want):
-- select id, name, cuisine, city, tags from public.restaurants order by created_at desc;
