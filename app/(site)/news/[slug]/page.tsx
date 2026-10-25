import { Fragment } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "@/components/AdSlot";
import { BlockTitle, CardV } from "@/components/cards";
import Icon from "@/components/Icon";
import Sidebar from "@/components/Sidebar";
import { getSessionUser } from "@/lib/auth";
import { categoryName } from "@/lib/categories";
import { formatDate, paragraphs } from "@/lib/format";
import { getArticleBySlug, incrementViews, listArticles } from "@/lib/store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await getArticleBySlug(decodeURIComponent((await params).slug));
  // Don't reveal draft titles to visitors (admins can still preview the page).
  if (!a || (a.status !== "published" && !(await getSessionUser()))) return { title: "Not found" };
  return {
    title: a.title,
    description: a.excerpt,
    openGraph: { title: a.title, description: a.excerpt, images: [a.image], type: "article" },
  };
}

export default async function ArticlePage({ params }: Props) {
  const slug = decodeURIComponent((await params).slug);
  const a = await getArticleBySlug(slug);
  const isAdmin = !!(await getSessionUser());
  // Drafts are only visible to a logged-in admin (preview).
  if (!a || (a.status !== "published" && !isAdmin)) notFound();
  if (a.status === "published") await incrementViews(a.id);

  const related = (await listArticles({ category: a.category, excludeIds: [a.id], limit: 3 })).items;
  const catName = await categoryName(a.category);
  const h = await headers();
  const origin = process.env.SITE_URL || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const url = encodeURIComponent(`${origin}/news/${a.slug}`);
  const text = encodeURIComponent(a.title);
  const paras = paragraphs(a.content);
  // Long articles get an inline ad after a random paragraph, away from the start and end.
  const adAfter = paras.length >= 4 ? 2 + Math.floor(Math.random() * (paras.length - 3)) : -1;

  return (
    <div className="container">
      <div className="breadcrumbs">
        <Link href="/">Home</Link> › <Link href={`/category/${a.category}`}>{catName}</Link>
      </div>
      <div className="with-sidebar">
        <article className="article">
          <Link href={`/category/${a.category}`} className="cat-label inline">
            {catName}
          </Link>
          {a.status === "draft" && (
            <span className="cat-label inline" style={{ background: "#e3202b", marginLeft: 6 }}>
              Draft preview
            </span>
          )}
          <h1>{a.title}</h1>
          <div className="a-meta">
            <span>
              By <b>{a.author}</b>
            </span>
            <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
              <Icon name="clock" size={13} /> {formatDate(a.publishedAt)}
            </span>
            <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
              <Icon name="eye" size={14} /> {a.views}
            </span>
            {isAdmin && (
              <Link href={`/admin/edit/${a.id}`} style={{ color: "var(--blue)", fontWeight: 600 }}>
                Edit this article
              </Link>
            )}
          </div>
          <div className="share">
            <a style={{ background: "#516eab" }} href={`https://www.facebook.com/sharer/sharer.php?u=${url}`} target="_blank" rel="noreferrer">
              <Icon name="facebook" size={14} /> Facebook
            </a>
            <a style={{ background: "#111" }} href={`https://x.com/intent/tweet?text=${text}&url=${url}`} target="_blank" rel="noreferrer">
              <Icon name="x" size={14} /> Twitter
            </a>
            <a style={{ background: "#25d366" }} href={`https://wa.me/?text=${text}%20${url}`} target="_blank" rel="noreferrer">
              <Icon name="whatsapp" size={14} /> WhatsApp
            </a>
          </div>
          <figure className="feature" style={{ margin: "0 0 26px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.image} alt={a.title} />
          </figure>
          <div className="body">
            {paras.map((p, i) => (
              <Fragment key={i}>
                <p>{p}</p>
                {i + 1 === adAfter && <AdSlot placement="inline" className="in-body" />}
              </Fragment>
            ))}
          </div>
          {a.tags.length > 0 && (
            <div className="tags">
              <span className="t-label">Tags</span>
              {a.tags.map((t) => (
                <Link key={t} href={`/search?q=${encodeURIComponent(t)}`}>
                  {t}
                </Link>
              ))}
            </div>
          )}
          <div className="author-box">
            <div className="av">{a.author.charAt(0)}</div>
            <div>
              <b>{a.author}</b>
              <p className="excerpt" style={{ margin: "4px 0 0" }}>
                Reporter at E24 News covering {catName}.
              </p>
            </div>
          </div>
          {related.length > 0 && (
            <section>
              <BlockTitle title="Related Articles" category={a.category} />
              <div className="grid-3">
                {related.map((r) => (
                  <CardV key={r.id} a={r} size="sm" titleMax={60} />
                ))}
              </div>
            </section>
          )}
        </article>
        <Sidebar full={false} />
      </div>
    </div>
  );
}
