import { Fragment } from "react";
import AdSlot from "@/components/AdSlot";
import { BlockTitle, CardH, CardRow, CardV, OverlayCard } from "@/components/cards";
import PagedBlock from "@/components/PagedBlock";
import Pagination from "@/components/Pagination";
import Sidebar, { MostPopular, RecentComments } from "@/components/Sidebar";
import Trending from "@/components/Trending";
import { countAds } from "@/lib/ads";
import { getCategories } from "@/lib/categories";
import { getLatest, listArticles } from "@/lib/store";
import type { Article } from "@/lib/types";

export const dynamic = "force-dynamic";

const PER_PAGE = 10;

/** Up to `n` distinct random positions in 1..max (an ad goes after section i-1). */
function randomGaps(max: number, n: number): Set<number> {
  const all = Array.from({ length: max }, (_, i) => i + 1);
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return new Set(all.slice(0, n));
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Big card on the left, list of small rows on the right (Don't Miss / World). */
function BigPlusList({ items }: { items: Article[] }) {
  const [first, ...rest] = items;
  if (!first) return null;
  return (
    <div className="split">
      <CardV a={first} excerpt={200} />
      <div className="list">
        {rest.slice(0, 4).map((a) => (
          <CardRow key={a.id} a={a} />
        ))}
      </div>
    </div>
  );
}

/** Two big cards, then a 2x2 grid of small rows (Qatar). */
function TwoBigPlusRows({ items }: { items: Article[] }) {
  return (
    <>
      <div className="grid-2">
        {items.slice(0, 2).map((a) => (
          <CardV key={a.id} a={a} size="md" excerpt={180} />
        ))}
      </div>
      <div className="grid-2-sm">
        {items.slice(2, 6).map((a) => (
          <CardRow key={a.id} a={a} />
        ))}
      </div>
    </>
  );
}

/** Overlay card on top, three small rows below (Tech / Movies / Sports columns). */
function OverlayColumn({ category, items }: { category: string; items: Article[] }) {
  const [first, ...rest] = items;
  return (
    <section>
      <BlockTitle category={category} />
      {first ? (
        <>
          <OverlayCard a={first} size="md" titleMax={60} />
          <div className="list tight">
            {rest.slice(0, 3).map((a) => (
              <CardRow key={a.id} a={a} xs />
            ))}
          </div>
        </>
      ) : (
        <p className="excerpt">No posts yet.</p>
      )}
    </section>
  );
}

export default async function Home({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const categories = await getCategories();
  // Home sections are tied to these slugs; a section disappears if its category is deleted.
  const has = (slug: string) => categories.some((c) => c.slug === slug);

  const [featured, trending, dontMiss, qatar, gulf, world, grama, tech, movies, sports, latest] = await Promise.all([
    listArticles({ featured: true, limit: 4 }).then((r) => r.items),
    listArticles({ trending: true, limit: 8 }).then((r) => r.items),
    listArticles({ limit: 15 }).then((r) => r.items),
    getLatest(12, "qatar"),
    getLatest(9, "gulf"),
    getLatest(5, "world"),
    getLatest(5, "grama-vartha"),
    getLatest(4, "tech"),
    getLatest(4, "movies"),
    getLatest(4, "sports"),
    listArticles({ limit: PER_PAGE, offset: (page - 1) * PER_PAGE }),
  ]);

  // Hero falls back to latest posts if fewer than four are marked featured.
  const hero = [...featured, ...dontMiss.filter((a) => !featured.includes(a))].slice(0, 4);
  const band = dontMiss.slice(0, 3);
  const pages = Math.ceil(latest.total / PER_PAGE);

  // Left-column sections in order; inline ads are dropped between them at random.
  const sections: { key: string; node: React.ReactNode }[] = [];
  sections.push({
    key: "dont-miss",
    node: (
      <section className="section">
        <h2 className="block-title" style={{ "--bc": "#f5c518", "--bt": "#111" } as React.CSSProperties}>
          <span>Don&apos;t Miss</span>
        </h2>
        <PagedBlock pages={chunk(dontMiss, 5).map((p, i) => <BigPlusList key={i} items={p} />)} />
      </section>
    ),
  });
  if (has("qatar"))
    sections.push({
      key: "qatar",
      node: (
        <section className="section">
          <BlockTitle category="qatar" />
          <PagedBlock pages={chunk(qatar, 6).map((p, i) => <TwoBigPlusRows key={i} items={p} />)} />
        </section>
      ),
    });
  if (has("gulf"))
    sections.push({
      key: "gulf",
      node: (
        <section className="section">
          <BlockTitle category="gulf" />
          <PagedBlock
            pages={chunk(gulf, 3).map((p, i) => (
              <div className="grid-3" key={i}>
                {p.map((a) => (
                  <CardV key={a.id} a={a} size="sm" titleMax={55} />
                ))}
              </div>
            ))}
          />
        </section>
      ),
    });
  if (has("world"))
    sections.push({
      key: "world",
      node: (
        <section className="section">
          <BlockTitle category="world" />
          <BigPlusList items={world} />
        </section>
      ),
    });
  if (has("grama-vartha"))
    sections.push({
      key: "grama-vartha",
      node: (
        <section className="section">
          <BlockTitle category="grama-vartha" />
          <div className="list" style={{ gap: 40 }}>
            {grama.map((a) => (
              <CardH key={a.id} a={a} />
            ))}
          </div>
        </section>
      ),
    });
  const adGaps = randomGaps(sections.length, Math.min(2, await countAds("inline")));

  return (
    <div className="container">
      <Trending items={trending.map((a) => ({ title: a.title, href: `/news/${a.slug}` }))} />

      {hero.length === 4 && (
        <section className="hero">
          <div className="h-main">
            <OverlayCard a={hero[0]} size="lg" />
          </div>
          <div>
            <OverlayCard a={hero[1]} size="md" />
          </div>
          <div className="h-right-bottom">
            <OverlayCard a={hero[2]} size="sm" titleMax={45} />
            <OverlayCard a={hero[3]} size="sm" titleMax={45} />
          </div>
        </section>
      )}

      {page === 1 && (
        <>
          <div className="with-sidebar">
            <div>
              {sections.map((sec, i) => (
                <Fragment key={sec.key}>
                  {sec.node}
                  {adGaps.has(i + 1) && <AdSlot placement="inline" className="section" />}
                </Fragment>
              ))}
            </div>
            <Sidebar />
          </div>

          <div className="three-cols">
            {has("tech") && <OverlayColumn category="tech" items={tech} />}
            {has("movies") && <OverlayColumn category="movies" items={movies} />}
            {has("sports") && <OverlayColumn category="sports" items={sports} />}
          </div>

          <div className="triple-band">
            {band.map((a) => (
              <OverlayCard key={a.id} a={a} size="md" center titleMax={60} />
            ))}
          </div>

          <div className="ad">
            <small>Advertisement</small>
            <div className="ad-box">
              <div>
                <b>Your brand here — reach thousands of readers daily</b>
                <div className="accent">Advertise on E24 News</div>
              </div>
              <span className="ad-cta">CONTACT US ›</span>
            </div>
          </div>
        </>
      )}

      <div className="with-sidebar">
        <section>
          <BlockTitle title="Latest Articles" />
          <div className="grid-2">
            {latest.items.map((a) => (
              <CardV key={a.id} a={a} size="md" titleMax={70} />
            ))}
          </div>
          <Pagination page={page} pages={pages} base="/" />
        </section>
        <aside className="sidebar">
          <MostPopular />
          <RecentComments />
        </aside>
      </div>
    </div>
  );
}
