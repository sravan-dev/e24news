-- Ads managed from /admin/ads. "sidebar" ads show in the right column,
-- "inline" ads are dropped at random spots between page sections.
create table public.ads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image text not null,
  link_url text not null default '',
  placement text not null check (placement in ('sidebar', 'inline')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ads_placement_idx on public.ads (placement) where active;

alter table public.ads enable row level security;

-- Visitors (publishable key) can read active ads only; writes use the secret key.
create policy "Active ads are public"
  on public.ads for select
  to anon, authenticated
  using (active);
