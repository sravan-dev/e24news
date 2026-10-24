import Link from "next/link";
import { listArticles } from "@/lib/store";
import { BlockTitle, CardRow, CardV, MiniGrid } from "./cards";
import Icon from "./Icon";
import LoadMore from "./LoadMore";
import PagedBlock from "./PagedBlock";

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function StayConnected() {
  const rows = [
    { name: "facebook", color: "#516eab", count: "1,200", label: "Fans", act: "Like", href: "https://facebook.com" },
    { name: "x", color: "#29c5f6", count: "2,458", label: "Followers", act: "Follow", href: "https://x.com" },
    { name: "youtube", color: "#e14e42", count: "1,200", label: "Subscribers", act: "Subscribe", href: "https://youtube.com" },
  ];
  return (
    <section>
      <BlockTitle title="Stay Connected" />
      <div className="social-counter">
        {rows.map((r) => (
          <a key={r.name} href={r.href} target="_blank" rel="noreferrer">
            <span className="ico" style={{ background: r.color }}>
              <Icon name={r.name} size={22} />
            </span>
            <span className="cnt">
              {r.count} &nbsp;{r.label}
            </span>
            <span className="act">{r.act}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

export async function MakeItModern() {
  const { items } = await listArticles({ featured: true, limit: 12 });
  return (
    <section>
      <BlockTitle title="Make It Modern" />
      <PagedBlock pages={chunk(items, 4).map((p, i) => <MiniGrid key={i} items={p} />)} />
    </section>
  );
}

export async function LatestReviews() {
  const { items } = await listArticles({ category: "movies", limit: 3 });
  if (!items.length) return null;
  const [first, ...rest] = items;
  return (
    <section>
      <BlockTitle title="Latest Reviews" />
      <CardV a={first} size="md" excerpt={180} />
      <div className="list tight" style={{ marginTop: 26 }}>
        {rest.map((a) => (
          <CardRow key={a.id} a={a} />
        ))}
      </div>
    </section>
  );
}

export async function MostPopular() {
  const { items } = await listArticles({ sort: "popular", limit: 12 });
  return (
    <section>
      <BlockTitle title="Most Popular" />
      <LoadMore items={items.map((a) => <CardRow key={a.id} a={a} />)} />
    </section>
  );
}

export async function RecentComments() {
  const { items } = await listArticles({ limit: 3, offset: 4 });
  const names = ["Salim Edassery", "Babu", "Meera K"];
  return (
    <section>
      <BlockTitle title="Recent Comments" />
      {items.map((a, i) => (
        <div className="comment-item" key={a.id}>
          {names[i % names.length]} on <Link href={`/news/${a.slug}`}>{a.title}</Link>
        </div>
      ))}
    </section>
  );
}

export default async function Sidebar({ full = true }: { full?: boolean }) {
  return (
    <aside className="sidebar">
      <StayConnected />
      {full && <MakeItModern />}
      <MostPopular />
      {full && <LatestReviews />}
      <RecentComments />
    </aside>
  );
}
