// Writes supabase/seed.sql from the dummy content in lib/seed.ts.
// Usage: npx tsx scripts/gen-seed.ts   (then run the file in the Supabase SQL editor)
import { writeFileSync } from "fs";
import { buildSeed } from "../lib/seed";

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const rows = buildSeed().map(
  (a) =>
    `(${q(a.title)},${q(a.slug)},${q(a.category)},${q(a.author)},${a.featured},${a.trending},${a.views},${q(a.publishedAt)})`,
);
// Excerpt, body and image are built in SQL to keep the file small; text matches lib/seed.ts.
const sql = `insert into public.articles (slug, title, excerpt, content, image, category, author, tags, featured, trending, views, published_at, updated_at)
select s.slug, s.title, e.excerpt,
  e.excerpt || E'\n\n' ||
  'Officials said the details would be shared in the coming days. Local residents and community leaders welcomed the move, while others raised questions about the timeline and the cost involved. A detailed statement is expected later this week.' || E'\n\n' ||
  'This is placeholder text for the ' || replace(s.category, '-', ' ') || ' section. Replace it from the admin panel with the real story, quotes and context. Paragraphs are separated by a blank line, and each one is shown as its own block on the article page.' || E'\n\n' ||
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Cras mattis consectetur purus sit amet fermentum. Donec ullamcorper nulla non metus auctor fringilla.' || E'\n\n' ||
  'E24 News will continue to follow the story and update this report as more information becomes available.',
  'https://picsum.photos/seed/' || left(s.slug, 30) || '/1200/800',
  s.category, s.author, array[s.category], s.featured, s.trending, s.views, s.published_at::timestamptz, s.published_at::timestamptz
from (values
${rows.join(",\n")}
) as s(title, slug, category, author, featured, trending, views, published_at)
cross join lateral (select s.title || '. Our correspondent reports on the latest developments, reactions from the people involved and what it means for readers across Kerala and the Gulf.' as excerpt) e
on conflict (slug) do nothing;
`;
writeFileSync("supabase/seed.sql", sql);
console.log(`${rows.length} rows -> supabase/seed.sql`);
