-- HealthyHub — minimal Supabase schema
-- Run this once in the Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.restaurants (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  description   text,
  image_url     text,
  city          text,
  cuisine       text,
  tags          text[] default '{}',
  uber_eats_url text,
  deliveroo_url text,
  created_at    timestamptz not null default now()
);

-- Public read-only access (no auth in MVP)
alter table public.restaurants enable row level security;

drop policy if exists "Public can read restaurants" on public.restaurants;
create policy "Public can read restaurants"
  on public.restaurants
  for select
  using (true);

-- Optional seed data ---------------------------------------------------------
insert into public.restaurants
  (name, slug, description, image_url, city, cuisine, tags, uber_eats_url, deliveroo_url)
values
  (
    'Green Bowl',
    'green-bowl',
    'Seasonal grain bowls, fresh salads, and cold-pressed juices.',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200',
    'Paris',
    'Bowls & Salads',
    array['vegan', 'gluten-free', 'organic'],
    'https://www.ubereats.com/',
    'https://deliveroo.com/'
  ),
  (
    'Poke Lab',
    'poke-lab',
    'Build-your-own poke bowls with sustainably sourced fish.',
    'https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200',
    'London',
    'Poke',
    array['high-protein', 'pescatarian'],
    'https://www.ubereats.com/',
    'https://deliveroo.com/'
  ),
  (
    'Sprout Kitchen',
    'sprout-kitchen',
    'Plant-based comfort food without the guilt.',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200',
    'Berlin',
    'Plant-based',
    array['vegan', 'low-sugar'],
    'https://www.ubereats.com/',
    null
  );
