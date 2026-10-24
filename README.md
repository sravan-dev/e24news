# E24 News

News portal built with Next.js 16 (App Router) + React 19, styled after `design.png`, with an admin panel to manage news.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production
```

## Deploy

- Live: https://e24news.vercel.app — repo: https://github.com/sravan-dev/e24news
- Vercel project `e24news` is connected to this repo: every push to `main` deploys to production; other branches get preview URLs.
- Environment variables (Supabase keys, admin login, `SITE_URL`) are set in Vercel → Project → Settings → Environment Variables.

## Admin

- URL: `/admin` (login at `/admin/login`)
- Credentials come from `.env.local` (`ADMIN_USER`, `ADMIN_PASSWORD`). Change them and `SESSION_SECRET` before going live.
- Add / edit / delete news, upload a featured image (or paste a URL), set category, author, tags, publish date, draft/published.
- Toggle **Featured** (homepage hero + "Make it modern") and **Trending** (top ticker) right from the list.
- Drafts are hidden from the public site; logged-in admins can preview them.
- Deleting an article (or replacing its image) also removes the uploaded image from Storage.

## Data (Supabase)

- Project **e24news** (`gbspulptzxtocxzxyzlp`, region ap-south-1). Table `public.articles`; images in the public Storage bucket `news-images`.
- `.env.local` needs `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` (secret key: Supabase → Project Settings → API Keys). The secret key stays on the server — never expose or commit it.
- Row Level Security: visitors can only read published articles; all writes happen server-side with the secret key.
- Schema: `supabase/migrations/`. Dummy content: `npm run seed:sql` writes `supabase/seed.sql` (run it in the SQL editor; existing slugs are skipped).
- All reads/writes go through `lib/store.ts`.
- Works on any Node host, including Vercel (add the same env vars there).

## Structure

- `app/(site)/` — public pages: home, `/category/[slug]`, `/news/[slug]`, `/search`, about, contact
- `app/admin/` — login, dashboard, add/edit forms, server actions
- `components/` — header, nav, cards, sidebar widgets
- `lib/categories.ts` — menu categories and their colours
