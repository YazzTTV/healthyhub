-- HealthyHub migration: self-contained Paris seed.
-- Creates the table & all expected columns if missing, enables RLS,
-- then inserts 10 healthy Paris restaurants.
-- Fully idempotent — safe to run multiple times.

begin;

-- 0) Ensure pgcrypto for gen_random_uuid()
create extension if not exists "pgcrypto";

-- 1) Create the table if it doesn't exist (minimal core)
create table if not exists public.restaurants (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- 2) Add every column the app expects if missing
alter table public.restaurants
  add column if not exists slug          text,
  add column if not exists description   text,
  add column if not exists image_url     text,
  add column if not exists city          text,
  add column if not exists cuisine       text,
  add column if not exists tags          text[] default '{}',
  add column if not exists uber_eats_url text,
  add column if not exists deliveroo_url text;

-- 3) Backfill any null/empty slug so the column can become NOT NULL + UNIQUE
update public.restaurants
set slug =
  trim(
    both '-' from
    regexp_replace(
      lower(coalesce(name, 'restaurant')),
      '[^a-z0-9]+',
      '-',
      'g'
    )
  ) || '-' || substring(id::text from 1 for 8)
where slug is null or slug = '';

-- 4) Enforce NOT NULL + unique constraint on slug (idempotent)
alter table public.restaurants
  alter column slug set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.restaurants'::regclass
      and contype  = 'u'
      and conname  = 'restaurants_slug_key'
  ) then
    alter table public.restaurants
      add constraint restaurants_slug_key unique (slug);
  end if;
end $$;

-- 5) RLS + public-read policy (required for the anon key to SELECT)
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

-- 6) Seed 10 top healthy restaurants in Paris (idempotent via slug conflict)
insert into public.restaurants
  (name, slug, description, image_url, city, cuisine, tags, uber_eats_url, deliveroo_url)
values
  (
    'Wild & The Moon',
    'wild-and-the-moon-paris',
    'Jus pressés à froid, bols végétaux, desserts crus. 100% végétal, 100% bio, zéro déchet — une référence parisienne du healthy depuis 2016.',
    'https://images.unsplash.com/photo-1610552050890-fe99536c2615?w=1200&auto=format&fit=crop',
    'Paris',
    'Plant-based · Jus pressés',
    array['vegan','bio','sans gluten','cold-press','zéro déchet'],
    'https://www.ubereats.com/fr/search?q=Wild+%26+The+Moon',
    'https://deliveroo.fr/fr/search?query=Wild+%26+The+Moon'
  ),
  (
    'Season Paris',
    'season-paris',
    'Bols de saison, pancakes protéinés et brunchs équilibrés dans un écrin lumineux du Marais. Le paradis du healthy photogénique.',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&auto=format&fit=crop',
    'Paris 3e',
    'Brunch · Bols',
    array['sans gluten','brunch','bowl','protéiné'],
    'https://www.ubereats.com/fr/search?q=Season+Paris',
    'https://deliveroo.fr/fr/search?query=Season+Paris'
  ),
  (
    'Nanashi',
    'nanashi',
    'Bentos japonais revisités : riz complet, poisson frais, légumes de saison. La cantine saine inspirée du Japon par Kaori Endo.',
    'https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&auto=format&fit=crop',
    'Paris 10e',
    'Japonais · Bentos',
    array['poisson','équilibré','bento','maison'],
    'https://www.ubereats.com/fr/search?q=Nanashi',
    'https://deliveroo.fr/fr/search?query=Nanashi'
  ),
  (
    'Abattoir Végétal',
    'abattoir-vegetal',
    'Cuisine 100% végétale généreuse et colorée, à deux pas du Sacré-Cœur. Des assiettes qui convertissent même les carnivores.',
    'https://images.unsplash.com/photo-1540914124281-342587941389?w=1200&auto=format&fit=crop',
    'Paris 18e',
    'Vegan · Comfort food',
    array['vegan','bio','local','sans gluten'],
    'https://www.ubereats.com/fr/search?q=Abattoir+V%C3%A9g%C3%A9tal',
    'https://deliveroo.fr/fr/search?query=Abattoir+V%C3%A9g%C3%A9tal'
  ),
  (
    'Bob''s Kitchen',
    'bobs-kitchen',
    'Le pionnier du brunch healthy dans le Marais : soupes, chili végétarien, cookies aux graines. Authentique et sans chichis.',
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=1200&auto=format&fit=crop',
    'Paris 3e',
    'Végétarien · Brunch',
    array['végétarien','vegan','brunch','maison'],
    'https://www.ubereats.com/fr/search?q=Bob%27s+Kitchen',
    'https://deliveroo.fr/fr/search?query=Bob%27s+Kitchen'
  ),
  (
    'Jah Jah by Le Tricycle',
    'jah-jah-by-le-tricycle',
    'Soul food afro-caribéenne 100% végétale. Plantain, patate douce, tofu fumé maison — copieux, épicé, généreux.',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&auto=format&fit=crop',
    'Paris 10e',
    'Vegan · Afro-caribéen',
    array['vegan','épicé','soul food','sans gluten'],
    'https://www.ubereats.com/fr/search?q=Jah+Jah',
    'https://deliveroo.fr/fr/search?query=Jah+Jah'
  ),
  (
    'Maisie Café',
    'maisie-cafe',
    'Café 100% bio, sans gluten et sans lactose. Pâtisseries qui donnent envie, cuisine simple et lumineuse près du Palais Royal.',
    'https://images.unsplash.com/photo-1511690078903-71dc5a49f5e3?w=1200&auto=format&fit=crop',
    'Paris 1er',
    'Café · Sans gluten',
    array['bio','sans gluten','sans lactose','pâtisserie'],
    'https://www.ubereats.com/fr/search?q=Maisie+Caf%C3%A9',
    'https://deliveroo.fr/fr/search?query=Maisie+Caf%C3%A9'
  ),
  (
    'Echo',
    'echo-paris',
    'Brunch californien chic dans le Sentier : avocado toasts, pancakes à la banane, bols acai. Instagrammable et vraiment bon.',
    'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=1200&auto=format&fit=crop',
    'Paris 2e',
    'Brunch · Californien',
    array['brunch','toast','bowl','avocat'],
    'https://www.ubereats.com/fr/search?q=Echo+Paris',
    'https://deliveroo.fr/fr/search?query=Echo+Paris'
  ),
  (
    'La Guinguette d''Angèle',
    'la-guinguette-dangele',
    'Traiteur healthy par la cheffe Angèle Ferreux-Maeght. Bowls, tartes salées et desserts crus, entièrement sans gluten et bio.',
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&auto=format&fit=crop',
    'Paris 1er',
    'Traiteur · Sans gluten',
    array['sans gluten','bio','cru','vegan'],
    'https://www.ubereats.com/fr/search?q=La+Guinguette+d%27Ang%C3%A8le',
    'https://deliveroo.fr/fr/search?query=La+Guinguette+d%27Ang%C3%A8le'
  ),
  (
    'Tekés',
    'tekes-paris',
    'Cuisine méditerranéenne 100% végétale par Assaf Granit. Hummus onctueux, pitas chaudes, légumes grillés — une fête dans l''assiette.',
    'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=1200&auto=format&fit=crop',
    'Paris 2e',
    'Vegan · Méditerranéen',
    array['vegan','méditerranéen','mezze','pita'],
    'https://www.ubereats.com/fr/search?q=Tek%C3%A9s',
    'https://deliveroo.fr/fr/search?query=Tek%C3%A9s'
  )
on conflict (slug) do nothing;

commit;

-- Vérification :
-- select name, city, cuisine, array_length(tags, 1) as nb_tags
-- from public.restaurants order by created_at desc;
