create table public.categories (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  color text not null default '#222222' check (color ~ '^#[0-9a-fA-F]{6}$'),
  sort_order integer not null default 0,
  show_in_menu boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.categories (slug, name, color, sort_order) values
  ('qatar', 'Qatar', '#2e7d32', 10),
  ('gulf', 'Gulf', '#546e7a', 20),
  ('kerala', 'Kerala', '#e3202b', 30),
  ('india', 'India', '#ef6c00', 40),
  ('grama-vartha', 'Grama Vartha', '#222222', 50),
  ('writers-corner', 'Writers Corner', '#6a1b9a', 60),
  ('tech', 'Tech', '#1a73d0', 70),
  ('movies', 'Movies', '#222222', 80),
  ('world', 'World', '#e3202b', 90),
  ('sports', 'Sports', '#00897b', 100),
  ('magazines', 'Magazines', '#ad1457', 110);

-- Articles must point at a real category; renaming a slug carries over,
-- deleting a category that still has articles is refused.
alter table public.articles
  add constraint articles_category_fkey foreign key (category)
  references public.categories (slug) on update cascade on delete restrict;

alter table public.categories enable row level security;

create policy "Categories are public"
  on public.categories for select
  to anon, authenticated
  using (true);
