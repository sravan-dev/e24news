-- Applied to Supabase project "e24news" (gbspulptzxtocxzxyzlp).
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  content text not null default '',
  image text not null default '',
  category text not null,
  author text not null default 'E24 Desk',
  tags text[] not null default '{}',
  featured boolean not null default false,
  trending boolean not null default false,
  status text not null default 'published' check (status in ('published', 'draft')),
  views integer not null default 0,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index articles_status_published_idx on public.articles (status, published_at desc);
create index articles_category_idx on public.articles (category, status, published_at desc);
create index articles_views_idx on public.articles (views desc);

alter table public.articles enable row level security;

-- Visitors (publishable key) can read published articles only.
-- All writes go through the server with the secret key, which bypasses RLS.
create policy "Published articles are public"
  on public.articles for select
  to anon, authenticated
  using (status = 'published');

-- Page-view counter; only the server (secret key) may call it.
create or replace function public.increment_article_views(article_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.articles set views = views + 1
  where id = article_id and status = 'published';
$$;

revoke all on function public.increment_article_views(uuid) from public, anon, authenticated;
grant execute on function public.increment_article_views(uuid) to service_role;

-- Public bucket for featured images (uploads happen server-side with the secret key).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('news-images', 'news-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
