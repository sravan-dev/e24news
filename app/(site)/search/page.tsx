import type { Metadata } from "next";
import { CardH } from "@/components/cards";
import Pagination from "@/components/Pagination";
import Sidebar from "@/components/Sidebar";
import { listArticles } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Search" };

const PER_PAGE = 10;

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);
  const { items, total } = q
    ? await listArticles({ search: q, limit: PER_PAGE, offset: (page - 1) * PER_PAGE })
    : { items: [], total: 0 };

  return (
    <div className="container">
      <div className="page-head">
        <h1>Search results{q && <> for &ldquo;{q}&rdquo;</>}</h1>
        <p>{q ? `${total} article${total === 1 ? "" : "s"} found` : "Type something in the search box."}</p>
        <form action="/search" style={{ display: "flex", gap: 8, marginTop: 16, maxWidth: 480 }}>
          <input name="q" defaultValue={q} placeholder="Search news..." style={{ flex: 1, border: "1px solid #ddd", padding: "9px 12px", fontSize: 14 }} />
          <button className="btn">Search</button>
        </form>
      </div>
      <div className="with-sidebar">
        <section>
          {q && items.length === 0 ? (
            <p className="empty">No results. Try a different keyword.</p>
          ) : (
            <div className="list" style={{ gap: 40 }}>
              {items.map((a) => (
                <CardH key={a.id} a={a} />
              ))}
            </div>
          )}
          <Pagination page={page} pages={Math.ceil(total / PER_PAGE)} base={`/search?q=${encodeURIComponent(q)}`} />
        </section>
        <Sidebar full={false} />
      </div>
    </div>
  );
}
