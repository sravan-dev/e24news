import "server-only";
import crypto from "crypto";
import type { Article } from "./types";
import { slugify } from "./format";
import { admin, db, hasSecretKey, IMAGE_BUCKET } from "./supabase";

// All article reads/writes go through this module (Supabase table public.articles).

interface Row {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  author: string;
  tags: string[];
  featured: boolean;
  trending: boolean;
  status: "published" | "draft";
  views: number;
  published_at: string;
  updated_at: string;
}

function toArticle(r: Row): Article {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    content: r.content,
    image: r.image,
    category: r.category,
    author: r.author,
    tags: r.tags ?? [],
    featured: r.featured,
    trending: r.trending,
    status: r.status,
    views: r.views,
    publishedAt: r.published_at,
    updatedAt: r.updated_at,
  };
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(`Supabase: ${res.error.message}`);
  return res.data;
}

export interface Query {
  category?: string;
  featured?: boolean;
  trending?: boolean;
  search?: string;
  excludeIds?: string[];
  limit?: number;
  offset?: number;
  includeDrafts?: boolean;
  status?: "published" | "draft";
  sort?: "latest" | "popular";
}

export async function listArticles(q: Query = {}): Promise<{ items: Article[]; total: number }> {
  const needsAdmin = q.includeDrafts || q.status === "draft";
  let query = (needsAdmin ? admin() : db()).from("articles").select("*", { count: "exact" });

  if (q.status) query = query.eq("status", q.status);
  else if (!q.includeDrafts) query = query.eq("status", "published");
  if (q.category) query = query.eq("category", q.category);
  if (q.featured) query = query.eq("featured", true);
  if (q.trending) query = query.eq("trending", true);
  if (q.excludeIds?.length) query = query.not("id", "in", `(${q.excludeIds.join(",")})`);
  if (q.search) {
    // Strip characters that have meaning in PostgREST filter syntax.
    const s = q.search.replace(/[,()"{}%\\*]/g, " ").trim();
    if (s) query = query.or(`title.ilike.%${s}%,excerpt.ilike.%${s}%,tags.cs.{"${s}"}`);
  }
  query =
    q.sort === "popular"
      ? query.order("views", { ascending: false })
      : query.order("published_at", { ascending: false });

  const offset = q.offset ?? 0;
  if (q.limit === 0) query = query.limit(1); // count only
  else if (q.limit !== undefined) query = query.range(offset, offset + q.limit - 1);
  else if (offset) query = query.range(offset, offset + 999);

  const { data, error, count } = await query;
  if (error) throw new Error(`Supabase: ${error.message}`);
  return { items: q.limit === 0 ? [] : (data as Row[]).map(toArticle), total: count ?? 0 };
}

export async function getLatest(limit: number, category?: string): Promise<Article[]> {
  return (await listArticles({ limit, category })).items;
}

export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  const row = check(await db().from("articles").select("*").eq("slug", slug).maybeSingle());
  return row ? toArticle(row as Row) : undefined;
}

export async function getArticleById(id: string): Promise<Article | undefined> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
  const row = check(await admin().from("articles").select("*").eq("id", id).maybeSingle());
  return row ? toArticle(row as Row) : undefined;
}

export async function stats() {
  const rows = check(await admin().from("articles").select("status, category, views")) as Pick<
    Row,
    "status" | "category" | "views"
  >[];
  const byCategory: Record<string, number> = {};
  for (const r of rows) byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
  return {
    total: rows.length,
    published: rows.filter((r) => r.status === "published").length,
    drafts: rows.filter((r) => r.status === "draft").length,
    views: rows.reduce((s, r) => s + r.views, 0),
    byCategory,
  };
}

async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const root = slugify(base) || "article";
  const rows = check(
    await admin().from("articles").select("id, slug").or(`slug.eq.${root},slug.like.${root}-%`),
  ) as Pick<Row, "id" | "slug">[];
  const taken = new Set(rows.filter((r) => r.id !== ignoreId).map((r) => r.slug));
  let slug = root;
  let i = 2;
  while (taken.has(slug)) slug = `${root}-${i++}`;
  return slug;
}

export type ArticleInput = Omit<Article, "id" | "slug" | "views" | "updatedAt"> & { slug?: string };

function toRow(input: ArticleInput) {
  return {
    title: input.title,
    excerpt: input.excerpt,
    content: input.content,
    image: input.image,
    category: input.category,
    author: input.author,
    tags: input.tags,
    featured: input.featured,
    trending: input.trending,
    status: input.status,
    published_at: input.publishedAt,
    updated_at: new Date().toISOString(),
  };
}

export async function createArticle(input: ArticleInput): Promise<Article> {
  const slug = await uniqueSlug(input.slug || input.title);
  const row = check(await admin().from("articles").insert({ ...toRow(input), slug }).select().single());
  return toArticle(row as Row);
}

export async function updateArticle(id: string, input: ArticleInput): Promise<Article | undefined> {
  const current = await getArticleById(id);
  if (!current) return undefined;
  const slug = await uniqueSlug(input.slug || current.slug, id);
  const row = check(await admin().from("articles").update({ ...toRow(input), slug }).eq("id", id).select().single());
  return toArticle(row as Row);
}

export async function deleteArticle(id: string): Promise<boolean> {
  const article = await getArticleById(id);
  if (!article) return false;
  check(await admin().from("articles").delete().eq("id", id));
  await removeImage(article.image);
  return true;
}

export async function toggleFlag(id: string, flag: "featured" | "trending"): Promise<void> {
  const article = await getArticleById(id);
  if (!article) return;
  check(await admin().from("articles").update({ [flag]: !article[flag] }).eq("id", id));
}

export async function incrementViews(id: string): Promise<void> {
  // Needs the secret key; silently skipped until it is configured.
  if (!hasSecretKey()) return;
  const { error } = await admin().rpc("increment_article_views", { article_id: id });
  if (error) console.error("increment_article_views:", error.message);
}

// ---------- Images (Supabase Storage) ----------

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
export const MAX_UPLOAD = 5 * 1024 * 1024;

/** Uploads an image to the public bucket and returns its public URL. */
export async function uploadImage(file: File, folder = ""): Promise<string> {
  const ext = IMAGE_TYPES[file.type];
  if (!ext) throw new Error("Image must be JPG, PNG, WebP, GIF or AVIF.");
  if (file.size > MAX_UPLOAD) throw new Error("Image must be 5 MB or smaller.");
  const d = new Date();
  const path = `${folder}${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${ext}`;
  const storage = admin().storage.from(IMAGE_BUCKET);
  const { error } = await storage.upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return storage.getPublicUrl(path).data.publicUrl;
}

/** Deletes an image from the bucket if the URL points at it (external URLs are left alone). */
export async function removeImage(url: string): Promise<void> {
  const marker = `/storage/v1/object/public/${IMAGE_BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return;
  const { error } = await admin().storage.from(IMAGE_BUCKET).remove([url.slice(i + marker.length)]);
  if (error) console.error("removeImage:", error.message);
}
