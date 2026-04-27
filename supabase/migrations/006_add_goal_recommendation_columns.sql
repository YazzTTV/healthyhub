begin;

alter table public.restaurants
  add column if not exists protein_level text,
  add column if not exists calorie_level text,
  add column if not exists clean_level text,
  add column if not exists recommended_for_weight_loss boolean,
  add column if not exists recommended_for_muscle_gain boolean,
  add column if not exists recommended_for_clean_eating boolean;

update public.restaurants
set
  protein_level = case
    when lower(coalesce(category, '')) like '%protein%' then 'high'
    when lower(coalesce(category, '')) like '%poke%' then 'high'
    when lower(coalesce(category, '')) like '%vegan%' then 'medium'
    when lower(coalesce(category, '')) like '%salad%' or lower(coalesce(category, '')) like '%salade%' then 'medium'
    when lower(coalesce(category, '')) like '%brunch%' then 'medium'
    else coalesce(protein_level, 'medium')
  end,
  calorie_level = case
    when lower(coalesce(category, '')) like '%salad%' or lower(coalesce(category, '')) like '%salade%' then 'low'
    when lower(coalesce(category, '')) like '%brunch%' then 'high'
    when lower(coalesce(category, '')) like '%protein%' then 'medium'
    when lower(coalesce(category, '')) like '%poke%' then 'medium'
    when lower(coalesce(category, '')) like '%vegan%' then 'medium'
    else coalesce(calorie_level, 'medium')
  end,
  clean_level = case
    when coalesce(healthy_score, 0) >= 4.5 then 'high'
    when lower(coalesce(category, '')) like '%salad%'
      or lower(coalesce(category, '')) like '%salade%'
      or lower(coalesce(category, '')) like '%vegan%'
      or lower(coalesce(category, '')) like '%poke%' then 'high'
    when coalesce(healthy_score, 0) >= 3.5 then 'medium'
    else coalesce(clean_level, 'medium')
  end;

update public.restaurants
set
  recommended_for_weight_loss =
    ((coalesce(calorie_level, 'medium') in ('low', 'medium'))
      and coalesce(clean_level, 'medium') = 'high'
      and coalesce(healthy_score, 0) >= 4),
  recommended_for_muscle_gain =
    (coalesce(protein_level, 'medium') = 'high'
      and coalesce(healthy_score, 0) >= 3),
  recommended_for_clean_eating =
    (coalesce(clean_level, 'medium') = 'high'
      and coalesce(healthy_score, 0) >= 4);

commit;
