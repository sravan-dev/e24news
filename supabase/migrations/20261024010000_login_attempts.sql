-- Failed/in-flight admin login attempts, shared across all server instances.
create table public.login_attempts (
  id bigint generated always as identity primary key,
  ip text not null,
  attempted_at timestamptz not null default now()
);
create index login_attempts_ip_time_idx on public.login_attempts (ip, attempted_at desc);
create index login_attempts_time_idx on public.login_attempts (attempted_at);

-- RLS on with no policies: only the server's secret key can touch this table.
alter table public.login_attempts enable row level security;
