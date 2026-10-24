import Link from "next/link";
import Icon from "./Icon";

export default function Pagination({ page, pages, base }: { page: number; pages: number; base: string }) {
  if (pages <= 1) return null;
  const href = (p: number) => `${base}${base.includes("?") ? "&" : "?"}page=${p}`;
  const nums = new Set([1, page - 1, page, page + 1, pages].filter((p) => p >= 1 && p <= pages));
  const list = [...nums].sort((a, b) => a - b);
  return (
    <div className="pagination">
      <div className="pages">
        {page > 1 && (
          <Link href={href(page - 1)} aria-label="Previous page">
            <Icon name="left" />
          </Link>
        )}
        {list.map((p, i) => (
          <span key={p} style={{ display: "contents" }}>
            {i > 0 && p - list[i - 1] > 1 && <span>…</span>}
            {p === page ? <span className="cur">{p}</span> : <Link href={href(p)}>{p}</Link>}
          </span>
        ))}
        {page < pages && (
          <Link href={href(page + 1)} aria-label="Next page">
            <Icon name="right" />
          </Link>
        )}
      </div>
      <span className="info">
        Page {page} of {pages}
      </span>
    </div>
  );
}
