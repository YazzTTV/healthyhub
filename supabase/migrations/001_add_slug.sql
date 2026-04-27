-- HealthyHub migration: add & backfill restaurants.slug
-- Safe to run multiple times (idempotent).

begin;

-- 1) Add slug column if it doesn't exist (nullable for now so we can backfill).
alter table public.restaurants
  add column if not exists slug text;

-- 2) Backfill any missing slugs: slugified name + short id suffix for uniqueness.
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

-- 3) If any duplicates somehow exist, disambiguate by appending short id.
update public.restaurants r
set slug = r.slug || '-' || substring(r.id::text from 1 for 4)
where exists (
  select 1
  from public.restaurants r2
  where r2.slug = r.slug
    and r2.id <> r.id
);

-- 4) Enforce NOT NULL now that every row has a value.
alter table public.restaurants
  alter column slug set not null;

-- 5) Add unique constraint if not already present.
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

commit;

-- Sanity check (run separately if you want):
-- select id, name, slug from public.restaurants order by created_at desc;
