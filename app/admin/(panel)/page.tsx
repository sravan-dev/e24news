import { hasSecretKey } from "@/lib/supabase";
import Link from "next/link";
import { CATEGORIES, categoryName } from "@/lib/categories";
import { formatDate } from "@/lib/format";
import { listArticles, stats } from "@/lib/store";
import { toggleArticleFlag } from "../actions";
import DeleteButton from "./DeleteButton";

const PER_PAGE = 15;

type SP = { q?: string; category?: string; status?: string; page?: string; saved?: string };

function FlagButton({ id, flag, on }: { id: string; flag: "featured" | "trending"; on: boolean }) {
  return (
    <form action={toggleArticleFlag}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="flag" value={flag} />
      <button className={`flag${on ? " on" : ""}`} title={`Toggle ${flag}`}>
        {flag === "featured" ? "Featured" : "Trending"}
      </button>
    </form>
  );
}

export default async function AdminHome({ searchParams }: { searchParams: Promise<SP> }) {
  if (!hasSecretKey()) return null; // layout shows setup steps
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status = sp.status === "published" || sp.status === "draft" ? sp.status : undefined;
  const [s, { items, total }] = await Promise.all([
    stats(),
    listArticles({
      includeDrafts: true,
      status,
      category: sp.category || undefined,
      search: sp.q || undefined,
      limit: PER_PAGE,
      offset: (page - 1) * PER_PAGE,
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (sp.q) u.set("q", sp.q);
    if (sp.category) u.set("category", sp.category);
    if (status) u.set("status", status);
    u.set("page", String(p));
    return `/admin?${u}`;
  };

  return (
    <>
      <div className="adm-head">
        <h1>News</h1>
        <Link href="/admin/new" className="adm-btn">
          + Add news
        </Link>
      </div>

      {sp.saved && <div className="notice ok">Saved &ldquo;{sp.saved}&rdquo;.</div>}

      <div className="adm-stats">
        <div className="adm-card">
          <div className="n">{s.total}</div>
          <div className="l">Total articles</div>
        </div>
        <div className="adm-card">
          <div className="n">{s.published}</div>
          <div className="l">Published</div>
        </div>
        <div className="adm-card">
          <div className="n">{s.drafts}</div>
          <div className="l">Drafts</div>
        </div>
        <div className="adm-card">
          <div className="n">{s.views.toLocaleString()}</div>
          <div className="l">Total views</div>
        </div>
      </div>

      <div className="adm-table-wrap">
        <form className="adm-filters">
          <input name="q" defaultValue={sp.q} placeholder="Search title, excerpt or tags..." />
          <select name="category" defaultValue={sp.category ?? ""}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name} ({s.byCategory[c.slug] ?? 0})
              </option>
            ))}
          </select>
          <select name="status" defaultValue={status ?? ""}>
            <option value="">Any status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <button className="adm-btn ghost">Filter</button>
          {(sp.q || sp.category || status) && (
            <Link href="/admin" className="adm-btn ghost">
              Clear
            </Link>
          )}
        </form>
        <div className="adm-table-scroll">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Homepage</th>
                <th>Views</th>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="t-title">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.image} alt="" loading="lazy" />
                      <div>
                        <Link href={`/admin/edit/${a.id}`}>{a.title}</Link>
                        <small>by {a.author}</small>
                      </div>
                    </div>
                  </td>
                  <td>{categoryName(a.category)}</td>
                  <td>
                    <span className={`pill ${a.status === "published" ? "pub" : "draft"}`}>
                      {a.status === "published" ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <FlagButton id={a.id} flag="featured" on={a.featured} />
                      <FlagButton id={a.id} flag="trending" on={a.trending} />
                    </div>
                  </td>
                  <td>{a.views}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{formatDate(a.publishedAt)}</td>
                  <td>
                    <div className="row-actions">
                      <Link href={`/news/${a.slug}`} target="_blank" className="adm-btn ghost">
                        View
                      </Link>
                      <Link href={`/admin/edit/${a.id}`} className="adm-btn ghost">
                        Edit
                      </Link>
                      <DeleteButton id={a.id} title={a.title} />
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
                    No articles match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="adm-pager">
          <span>
            {total} article{total === 1 ? "" : "s"} · page {page} of {pages}
          </span>
          <div>
            {page > 1 && (
              <Link className="adm-btn ghost" href={qs(page - 1)}>
                ← Prev
              </Link>
            )}
            {page < pages && (
              <Link className="adm-btn ghost" href={qs(page + 1)}>
                Next →
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
