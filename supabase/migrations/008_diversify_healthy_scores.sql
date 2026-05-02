-- Met à jour uniquement healthy_score (les autres colonnes inchangées).
-- Cible surtout les imports « tout à 5,0 » / null / ancienne échelle > 5,5.
-- Les scores déjà nuancés en base (ex. 4,2, 4,3) ne sont pas écrasés.
-- Déterministe : hashtext(id). Aligné sur `lib/healthy-score.ts`.

begin;

update public.restaurants r
set healthy_score = round(
  greatest(
    3.2::numeric,
    least(
      5.0::numeric,
      case
        when lower(coalesce(r.name, '')) ~ 'wild.*moon|wild and moon'
          then 4.65 + ((mod(abs(hashtext(r.id::text || '|wild')), 31))::numeric / 100.0)
        when lower(coalesce(r.name, '')) ~ 'cojean'
          then 4.38 + ((mod(abs(hashtext(r.id::text || '|coj')), 21))::numeric / 100.0)
        when lower(coalesce(r.name, '')) ~ 'pokawa'
          then 4.15 + ((mod(abs(hashtext(r.id::text || '|pok')), 28))::numeric / 100.0)
        when lower(coalesce(r.name, '')) ~ 'protein\s*kitchen'
          then 4.05 + ((mod(abs(hashtext(r.id::text || '|pk')), 35))::numeric / 100.0)
        when lower(coalesce(r.category, '') || ' ' || coalesce(r.cuisine, '') || ' ' || coalesce(r.name, '')) ~ 'brunch'
          then 3.62 + ((mod(abs(hashtext(r.id::text || '|br')), 79))::numeric / 100.0)
        when lower(coalesce(r.category, '') || ' ' || coalesce(r.name, '')) ~ 'burger|smash|comfort'
          and lower(coalesce(r.category, '')) !~ 'vegan'
          then 3.22 + ((mod(abs(hashtext(r.id::text || '|bur')), 89))::numeric / 100.0)
        when lower(coalesce(r.category, '') || ' ' || coalesce(r.cuisine, '')) ~ 'vegan|plant|organic|bio'
          then 4.42 + ((mod(abs(hashtext(r.id::text || '|veg')), 59))::numeric / 100.0)
        when lower(coalesce(r.category, '')) ~ 'salad|salade'
          then 4.22 + ((mod(abs(hashtext(r.id::text || '|sal')), 69))::numeric / 100.0)
        when lower(coalesce(r.category, '')) ~ 'poke|poké'
          then 3.92 + ((mod(abs(hashtext(r.id::text || '|pok2')), 79))::numeric / 100.0)
        when lower(coalesce(r.category, '')) ~ 'bowl'
          then 3.92 + ((mod(abs(hashtext(r.id::text || '|bowl')), 79))::numeric / 100.0)
        when lower(coalesce(r.category, '') || ' ' || coalesce(r.cuisine, '')) ~ 'protein|fitness'
          then 3.82 + ((mod(abs(hashtext(r.id::text || '|pro')), 79))::numeric / 100.0)
        else
          3.78 + ((mod(abs(hashtext(r.id::text || '|def')), 78))::numeric / 100.0)
      end
    )
  ),
  1
)::numeric(3, 1)
where
  r.healthy_score is null
  or r.healthy_score::numeric > 5.5
  or abs(r.healthy_score::numeric - 5.0) < 0.051;

commit;
