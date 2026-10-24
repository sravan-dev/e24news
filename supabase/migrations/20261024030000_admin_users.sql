-- Admin accounts managed from /admin/settings.
-- While this table is empty, ADMIN_USER / ADMIN_PASSWORD from the environment is the only login;
-- as soon as it has a row, the environment credentials stop working.
create table public.admin_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique check (username ~ '^[a-z0-9._@-]{3,64}$'),
  password_hash text not null,
  -- Bumped on every password change; sessions carry it, so old sessions stop working.
  session_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS on with no policies: only the server's secret key can touch this table.
alter table public.admin_users enable row level security;
