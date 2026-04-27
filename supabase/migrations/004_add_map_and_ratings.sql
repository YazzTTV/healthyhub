-- HealthyHub migration: ajoute carte, notes, catégorie, site web.
-- Idempotent — safe à rejouer.

begin;

alter table public.restaurants
  add column if not exists latitude     numeric(9,6),
  add column if not exists longitude    numeric(9,6),
  add column if not exists rating       numeric(2,1),
  add column if not exists review_count integer default 0,
  add column if not exists website_url  text,
  add column if not exists category     text;

-- Remplir les 10 restos parisiens avec coordonnées, note, site, catégorie.
update public.restaurants set
  latitude = 48.862000, longitude = 2.361900,
  rating = 4.6, review_count = 412,
  website_url = 'https://wildandthemoon.fr',
  category = 'Plant-based'
where slug = 'wild-and-the-moon-paris';

update public.restaurants set
  latitude = 48.863200, longitude = 2.364400,
  rating = 4.5, review_count = 523,
  website_url = 'https://www.season-paris.com',
  category = 'Bowls'
where slug = 'season-paris';

update public.restaurants set
  latitude = 48.862600, longitude = 2.362500,
  rating = 4.4, review_count = 287,
  website_url = 'https://www.nanashi.fr',
  category = 'Japonais'
where slug = 'nanashi';

update public.restaurants set
  latitude = 48.889300, longitude = 2.346000,
  rating = 4.7, review_count = 234,
  website_url = 'https://www.abattoirvegetal.fr',
  category = 'Vegan'
where slug = 'abattoir-vegetal';

update public.restaurants set
  latitude = 48.864700, longitude = 2.355700,
  rating = 4.3, review_count = 189,
  website_url = 'https://bobsjuicebar.com',
  category = 'Brunch'
where slug = 'bobs-kitchen';

update public.restaurants set
  latitude = 48.874400, longitude = 2.352900,
  rating = 4.7, review_count = 342,
  website_url = 'https://jahjah-paris.com',
  category = 'Vegan'
where slug = 'jah-jah-by-le-tricycle';

update public.restaurants set
  latitude = 48.865600, longitude = 2.328700,
  rating = 4.5, review_count = 178,
  website_url = 'https://maisiecafe.com',
  category = 'Sans gluten'
where slug = 'maisie-cafe';

update public.restaurants set
  latitude = 48.868500, longitude = 2.346300,
  rating = 4.4, review_count = 456,
  website_url = 'https://echoparis.com',
  category = 'Brunch'
where slug = 'echo-paris';

update public.restaurants set
  latitude = 48.864100, longitude = 2.343100,
  rating = 4.6, review_count = 267,
  website_url = 'https://www.laguinguettedangele.com',
  category = 'Sans gluten'
where slug = 'la-guinguette-dangele';

update public.restaurants set
  latitude = 48.865700, longitude = 2.348900,
  rating = 4.6, review_count = 389,
  website_url = 'https://tekes.paris',
  category = 'Méditerranéen'
where slug = 'tekes-paris';

commit;

-- Vérification :
-- select name, category, rating, review_count, latitude, longitude
-- from public.restaurants order by rating desc;
