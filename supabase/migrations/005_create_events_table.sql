create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  restaurant_id uuid null,
  metadata jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists idx_events_event_name on public.events(event_name);
create index if not exists idx_events_created_at on public.events(created_at desc);
