"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  authConfigured,
  beginLoginAttempt,
  checkCredentials,
  clearLoginAttempts,
  createSession,
  destroySession,
  requireAdmin,
} from "@/lib/auth";
import {
  createCategory,
  deleteCategory,
  getCategory,
  updateCategory,
  type CategoryInput,
} from "@/lib/categories";
import { slugify } from "@/lib/format";
import {
  createArticle,
  deleteArticle,
  getArticleById,
  removeImage,
  toggleFlag,
  updateArticle,
  uploadImage,
  type ArticleInput,
} from "@/lib/store";

export type FormState = { error?: string; ok?: string } | undefined;

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const user = String(form.get("user") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!authConfigured()) {
    return { error: "Admin login is not configured (ADMIN_USER, ADMIN_PASSWORD, SESSION_SECRET of 32+ characters)." };
  }
  // Vercel sets x-real-ip to the client address; clients cannot override it.
  // Only local development (no proxy) falls back to a fixed key; production fails closed.
  const realIp = (await headers()).get("x-real-ip");
  if (!realIp && process.env.VERCEL) return { error: "Could not verify your network address. Try again." };
  const ip = realIp ?? "local-dev";
  if (!(await beginLoginAttempt(ip))) {
    return { error: "Too many login attempts from your network. Try again in 15 minutes." };
  }
  if (!checkCredentials(user, password)) return { error: "Invalid username or password." };
  await clearLoginAttempts(ip);
  await createSession(user);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

function parseForm(form: FormData) {
  const get = (k: string) => String(form.get(k) ?? "").trim();
  return {
    title: get("title"),
    slug: get("slug"),
    excerpt: get("excerpt"),
    content: get("content").replace(/\r\n/g, "\n"),
    imageUrl: get("imageUrl"),
    category: get("category"),
    author: get("author") || "E24 Desk",
    tags: get("tags")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    featured: form.get("featured") === "on",
    trending: form.get("trending") === "on",
    status: form.get("status") === "draft" ? ("draft" as const) : ("published" as const),
    publishedAt: get("publishedAt"),
  };
}

export async function saveArticle(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  const f = parseForm(form);

  if (!f.title) return { error: "Title is required." };
  if (!(await getCategory(f.category))) return { error: "Choose a category." };
  if (!f.content) return { error: "Content is required." };

  let image = f.imageUrl;
  const file = form.get("imageFile");
  if (file instanceof File && file.size > 0) {
    try {
      image = await uploadImage(file);
    } catch (e) {
      return { error: (e as Error).message };
    }
  }
  if (!image) return { error: "Add a featured image (upload a file or paste an image URL)." };

  const published = f.publishedAt ? new Date(f.publishedAt) : new Date();
  if (Number.isNaN(published.getTime())) return { error: "Publish date is not valid." };

  const input: ArticleInput = {
    title: f.title,
    slug: f.slug || undefined,
    excerpt: f.excerpt || f.content.split("\n")[0].slice(0, 220),
    content: f.content,
    image,
    category: f.category,
    author: f.author,
    tags: f.tags,
    featured: f.featured,
    trending: f.trending,
    status: f.status,
    publishedAt: published.toISOString(),
  };

  let saved;
  try {
    const previous = id ? await getArticleById(id) : undefined;
    saved = id ? await updateArticle(id, input) : await createArticle(input);
    // Clean up the old uploaded image when it was replaced.
    if (saved && previous && previous.image !== saved.image) await removeImage(previous.image);
  } catch (e) {
    if (image !== f.imageUrl) await removeImage(image); // don't leave an orphaned upload
    return { error: (e as Error).message };
  }
  if (!saved) return { error: "Article not found — it may have been deleted." };
  revalidatePath("/", "layout");
  redirect(`/admin?saved=${encodeURIComponent(saved.title)}`);
}

export async function removeArticle(form: FormData) {
  await requireAdmin();
  await deleteArticle(String(form.get("id")));
  revalidatePath("/", "layout");
}

export async function toggleArticleFlag(form: FormData) {
  await requireAdmin();
  const flag = form.get("flag") === "trending" ? "trending" : "featured";
  await toggleFlag(String(form.get("id")), flag);
  revalidatePath("/", "layout");
}

// ---------- Categories ----------

function parseCategory(form: FormData): CategoryInput | string {
  const name = String(form.get("name") ?? "").trim();
  const slug = slugify(String(form.get("slug") ?? "").trim() || name);
  const color = String(form.get("color") ?? "#222222").trim();
  const sortOrder = Number(form.get("sortOrder") ?? 0);
  if (!name) return "Name is required.";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return "Slug may only contain lowercase letters, numbers and dashes.";
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return "Colour must look like #1a73d0.";
  if (!Number.isInteger(sortOrder)) return "Order must be a whole number.";
  return { name, slug, color, sortOrder, showInMenu: form.get("showInMenu") === "on" };
}

export async function saveCategory(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const input = parseCategory(form);
  if (typeof input === "string") return { error: input };
  const original = String(form.get("originalSlug") ?? "");
  try {
    if (original) await updateCategory(original, input);
    else await createCategory(input);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/", "layout");
  return { ok: original ? "Saved." : `Added "${input.name}".` };
}

export async function removeCategory(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  try {
    await deleteCategory(String(form.get("slug") ?? ""));
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/", "layout");
  return { ok: "Deleted." };
}
