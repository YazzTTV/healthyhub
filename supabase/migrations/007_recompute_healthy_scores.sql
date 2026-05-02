-- Recalcule healthy_score (échelle ~3,5–5,0) pour éviter une masse de "5,0" identiques.
-- À exécuter dans Supabase SQL Editor ou via CLI après déploiement.
-- Idempotent sur la colonne ; relancer met à jour tous les scores.

begin;

alter table public.restaurants
  add column if not exists healthy_score numeric(3, 1);

-- Dispersion déterministe par restaurant (évite que deux lignes identiques aient le même score).
-- hashtext(id::text) est stable en Postgres.
update public.restaurants r
set healthy_score = round(
  greatest(
    3.5::numeric,
    least(
      5.0::numeric,
      -- Base : note utilisateurs / maps (souvent 3,5–5,0), défaut si absent
      coalesce(r.rating::numeric, 4.05)
      -- Bonus catégories / cuisines plutôt "healthy"
      + (
        case
          when lower(coalesce(r.category, '')) ~ '(vegan|plant|salade|salad|poke|brunch|organic|bio)'
            then 0.18
          when lower(coalesce(r.category, '')) ~ '(bowl|protein|japonais|méditerranéen|sans gluten)'
            then 0.12
          else 0.06
        end
      )
      + (
        case
          when lower(coalesce(r.cuisine, '')) ~ '(vegan|bio|organic|cold.?press|plant)'
            then 0.08
          else 0
        end
      )
      -- Léger bonus si les tags évoquent des critères healthy
      + (
        case
          when lower(coalesce(array_to_string(r.tags, ' '), ''))
            ~ '(vegan|bio|sans gluten|organic|protéine|omega)'
            then 0.06
          else 0
        end
      )
      -- Variation contrôlée par id (± jusqu'à ~0,22)
      + ((abs(hashtext(r.id::text)) % 23)::numeric / 100.0)
    )
  ),
  1
)::numeric(3, 1);

commit;

-- Contrôle : distribution (à lancer à part)
-- select healthy_score, count(*) from public.restaurants group by 1 order by 1;
