import Link from "next/link";
import type { Article } from "@/lib/types";
import { categoryName, getCategory } from "@/lib/categories";
import { formatDate, truncate } from "@/lib/format";

export function articleHref(a: Article) {
  return `/news/${a.slug}`;
}

export async function CatLabel({ slug, inline }: { slug: string; inline?: boolean }) {
  return <span className={`cat-label${inline ? " inline" : ""}`}>{await categoryName(slug)}</span>;
}

export async function BlockTitle({ title, category, href }: { title?: string; category?: string; href?: string }) {
  const cat = category ? await getCategory(category) : undefined;
  const style = cat ? ({ "--bc": cat.color } as React.CSSProperties) : undefined;
  const link = href ?? (cat ? `/category/${cat.slug}` : undefined);
  return (
    <h2 className="block-title" style={style}>
      {link ? <Link href={link}>{title ?? cat?.name}</Link> : <span>{title ?? cat?.name}</span>}
    </h2>
  );
}

export function OverlayCard({
  a,
  size = "md",
  center,
  titleMax = 70,
}: {
  a: Article;
  size?: "lg" | "md" | "sm";
  center?: boolean;
  titleMax?: number;
}) {
  return (
    <Link href={articleHref(a)} className={`overlay-card ${size}${center ? " center" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={a.image} alt="" loading="lazy" />
      <div className="ov-body">
        <CatLabel slug={a.category} inline />
        {size === "lg" ? <h2>{truncate(a.title, titleMax)}</h2> : <h3>{truncate(a.title, titleMax)}</h3>}
        {size !== "sm" && <span className="date">{formatDate(a.publishedAt)}</span>}
      </div>
    </Link>
  );
}

export function CardV({
  a,
  size = "lg",
  excerpt,
  titleMax = 60,
  showLabel = true,
}: {
  a: Article;
  size?: "lg" | "md" | "sm";
  excerpt?: number;
  titleMax?: number;
  showLabel?: boolean;
}) {
  return (
    <article className={`card-v ${size}`}>
      <Link href={articleHref(a)} className="thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.image} alt="" loading="lazy" />
        {showLabel && <CatLabel slug={a.category} />}
      </Link>
      <h3>
        <Link href={articleHref(a)}>{truncate(a.title, titleMax)}</Link>
      </h3>
      {size !== "sm" && (
        <div className="meta">
          <span>{formatDate(a.publishedAt)}</span>
          <span className="comment-count">0</span>
        </div>
      )}
      {excerpt ? <p className="excerpt">{truncate(a.excerpt, excerpt)}</p> : null}
    </article>
  );
}

export function CardRow({ a, xs, titleMax = 60 }: { a: Article; xs?: boolean; titleMax?: number }) {
  return (
    <article className={`card-row${xs ? " xs" : ""}`}>
      <Link href={articleHref(a)} className="thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.image} alt="" loading="lazy" />
      </Link>
      <div>
        <h4>
          <Link href={articleHref(a)}>{truncate(a.title, titleMax)}</Link>
        </h4>
        <div className="meta">
          <span>{formatDate(a.publishedAt)}</span>
        </div>
      </div>
    </article>
  );
}

export function CardH({ a }: { a: Article }) {
  return (
    <article className="card-h">
      <Link href={articleHref(a)} className="thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.image} alt="" loading="lazy" />
      </Link>
      <div>
        <h3>
          <Link href={articleHref(a)}>{truncate(a.title, 80)}</Link>
        </h3>
        <div className="meta">
          <span>
            <span className="author">{a.author}</span> &nbsp;-&nbsp; {formatDate(a.publishedAt)}
          </span>
          <span className="comment-count">0</span>
        </div>
        <p className="excerpt">{truncate(a.excerpt, 220)}</p>
      </div>
    </article>
  );
}

export function MiniGrid({ items }: { items: Article[] }) {
  return (
    <div className="mini-grid">
      {items.map((a) => (
        <article key={a.id}>
          <Link href={articleHref(a)} className="thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.image} alt="" loading="lazy" />
            <CatLabel slug={a.category} />
          </Link>
          <h4>
            <Link href={articleHref(a)}>{truncate(a.title, 45)}</Link>
          </h4>
        </article>
      ))}
    </div>
  );
}
