create extension if not exists pgcrypto;

create table if not exists public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, restaurant_id)
);

create index if not exists user_favorites_user_id_idx
  on public.user_favorites(user_id);

create index if not exists user_favorites_restaurant_id_idx
  on public.user_favorites(restaurant_id);

alter table public.user_favorites enable row level security;

drop policy if exists "favorites_select_own" on public.user_favorites;
create policy "favorites_select_own"
  on public.user_favorites
  for select
  using (auth.uid() = user_id);

drop policy if exists "favorites_insert_own" on public.user_favorites;
create policy "favorites_insert_own"
  on public.user_favorites
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "favorites_delete_own" on public.user_favorites;
create policy "favorites_delete_own"
  on public.user_favorites
  for delete
  using (auth.uid() = user_id);

create table if not exists public.user_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  action text not null check (
    action in (
      'viewed_restaurant',
      'clicked_order_ubereats',
      'clicked_order_deliveroo',
      'clicked_marker',
      'clicked_card'
    )
  ),
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists user_history_user_id_created_at_idx
  on public.user_history(user_id, created_at desc);

create index if not exists user_history_restaurant_id_idx
  on public.user_history(restaurant_id);

create index if not exists user_history_action_idx
  on public.user_history(action);

alter table public.user_history enable row level security;

drop policy if exists "history_select_own" on public.user_history;
create policy "history_select_own"
  on public.user_history
  for select
  using (auth.uid() = user_id);

drop policy if exists "history_insert_own" on public.user_history;
create policy "history_insert_own"
  on public.user_history
  for insert
  with check (auth.uid() = user_id);
