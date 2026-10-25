"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  authConfigured,
  beginLoginAttempt,
  clearLoginAttempts,
  createSession,
  destroySession,
  requireAdmin,
} from "@/lib/auth";
import {
  createUser,
  deleteUser,
  loginAvailable,
  normalizeUsername,
  passwordProblem,
  setPassword,
  USERNAME_RE,
  verifyLogin,
} from "@/lib/users";
import {
  createCategory,
  deleteCategory,
  getCategory,
  moveArticles,
  updateCategory,
  type CategoryInput,
} from "@/lib/categories";
import { createAd, deleteAd, getAd, updateAd } from "@/lib/ads";
import { slugify } from "@/lib/format";
import {
  createArticle,
  deleteArticle,
  getArticleById,
  listArticles,
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
  if (!authConfigured() || !(await loginAvailable())) {
    return { error: "Admin login is not configured (SESSION_SECRET of 32+ characters, and ADMIN_USER / ADMIN_PASSWORD for the first sign-in)." };
  }
  // Vercel sets x-real-ip to the client address; clients cannot override it.
  // Only local development (no proxy) falls back to a fixed key; production fails closed.
  const realIp = (await headers()).get("x-real-ip");
  if (!realIp && process.env.VERCEL) return { error: "Could not verify your network address. Try again." };
  const ip = realIp ?? "local-dev";
  if (!(await beginLoginAttempt(ip))) {
    return { error: "Too many login attempts from your network. Try again in 15 minutes." };
  }
  const account = await verifyLogin(user, password);
  if (!account) return { error: "Invalid username or password." };
  await clearLoginAttempts(ip);
  await createSession(account.username, account.version);
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

/**
 * Deletes a category. If it still has articles, `mode` decides what happens to them:
 * "move" reassigns them to `target`, "delete" deletes them (and their uploaded images).
 */
export async function removeCategory(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const slug = String(form.get("slug") ?? "");
  const mode = String(form.get("mode") ?? "");
  const target = String(form.get("target") ?? "");
  try {
    if (!(await getCategory(slug))) return { error: "Category not found — it may have been deleted." };
    const { items } = await listArticles({ category: slug, includeDrafts: true });
    if (items.length > 0) {
      if (mode === "move") {
        if (!target || target === slug || !(await getCategory(target))) {
          return { error: "Choose another category to move the articles to." };
        }
        await moveArticles(slug, target);
      } else if (mode === "delete") {
        for (const a of items) await deleteArticle(a.id);
      } else {
        return { error: "Choose what to do with this category's articles." };
      }
    }
    await deleteCategory(slug);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/", "layout");
  return { ok: "Deleted." };
}

// ---------- Ads ----------

/** Creates or updates an ad. The image comes from an upload or a pasted URL. */
export async function saveAd(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const get = (k: string) => String(form.get(k) ?? "").trim();
  const id = get("id");
  const title = get("title");
  const linkUrl = get("linkUrl");
  const placement = get("placement");
  const imageUrl = get("imageUrl");
  if (!title) return { error: "Name is required (also used as the image's alt text)." };
  if (placement !== "sidebar" && placement !== "inline" && placement !== "header") return { error: "Choose where the ad shows." };
  if (linkUrl && !/^https?:\/\/\S+$/i.test(linkUrl)) return { error: "Link must start with http:// or https://" };
  if (imageUrl && !/^https?:\/\/\S+$/i.test(imageUrl)) return { error: "Image URL must start with http:// or https://" };

  let previous;
  try {
    previous = id ? await getAd(id) : undefined;
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (id && !previous) return { error: "Ad not found — it may have been deleted." };

  let image = imageUrl || previous?.image || "";
  const file = form.get("imageFile");
  if (file instanceof File && file.size > 0) {
    try {
      image = await uploadImage(file, "ads/");
    } catch (e) {
      return { error: (e as Error).message };
    }
  }
  if (!image) return { error: "Add the ad image (upload a file or paste an image URL)." };

  const input = { title, image, linkUrl, placement, active: form.get("active") === "on" } as const;
  try {
    if (previous) await updateAd(previous.id, input);
    else await createAd(input);
  } catch (e) {
    if (image !== imageUrl && image !== previous?.image) await removeImage(image); // don't leave an orphaned upload
    return { error: (e as Error).message };
  }
  if (previous && previous.image !== image) await removeImage(previous.image);
  revalidatePath("/", "layout");
  return { ok: previous ? "Saved." : `Added "${title}".` };
}

export async function removeAd(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  try {
    const ad = await getAd(String(form.get("id") ?? ""));
    if (!ad) return { error: "Ad not found — it may have been deleted." };
    await deleteAd(ad.id);
    await removeImage(ad.image);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/", "layout");
  return { ok: "Deleted." };
}

// ---------- Settings: admin users ----------

/** Changes the signed-in admin's own password. Other devices are signed out; this one stays in. */
export async function changeOwnPassword(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const current = String(form.get("current") ?? "");
  const password = String(form.get("password") ?? "");
  const problem = passwordProblem(password, String(form.get("confirm") ?? ""));
  if (problem) return { error: problem };
  try {
    if (!(await verifyLogin(me, current))) return { error: "Current password is wrong." };
    if (current === password) return { error: "The new password must be different." };
    await createSession(me, await setPassword(me, password));
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/admin/settings");
  return { ok: "Password changed. Other devices have been signed out." };
}

export async function addUser(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const username = normalizeUsername(String(form.get("username") ?? ""));
  const password = String(form.get("password") ?? "");
  if (!USERNAME_RE.test(username)) {
    return { error: "Username must be 3–64 characters: letters, numbers, dots, dashes, underscores or @." };
  }
  const problem = passwordProblem(password, String(form.get("confirm") ?? ""));
  if (problem) return { error: problem };
  try {
    await createUser(username, password);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/admin/settings");
  return { ok: `Added "${username}".` };
}

/** Sets a new password for another admin and signs them out everywhere. */
export async function resetUserPassword(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const username = String(form.get("username") ?? "");
  const password = String(form.get("password") ?? "");
  const problem = passwordProblem(password, String(form.get("confirm") ?? ""));
  if (problem) return { error: problem };
  try {
    const version = await setPassword(username, password);
    if (username === me) await createSession(me, version);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/admin/settings");
  return { ok: `New password set for "${username}".` };
}

export async function removeUser(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const username = String(form.get("username") ?? "");
  if (username === me) return { error: "You can't delete your own account." };
  try {
    await deleteUser(username);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/admin/settings");
  return { ok: "Deleted." };
}
