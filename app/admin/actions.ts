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
import { getCategory } from "@/lib/categories";
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
  // Vercel sets x-real-ip to the client address; clients cannot override it. Local dev has none.
  const ip = (await headers()).get("x-real-ip") ?? "local";
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
  if (!getCategory(f.category)) return { error: "Choose a category." };
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
