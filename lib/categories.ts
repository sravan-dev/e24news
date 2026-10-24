import "server-only";
import { cache } from "react";
import type { Category } from "./types";
import { admin, db } from "./supabase";

// Categories live in Supabase (public.categories) and are managed from /admin/categories.

interface Row {
  slug: string;
  name: string;
  color: string;
  sort_order: number;
  show_in_menu: boolean;
}

const toCategory = (r: Row): Category => ({
  slug: r.slug,
  name: r.name,
  color: r.color,
  sortOrder: r.sort_order,
  showInMenu: r.show_in_menu,
});

/** All categories in menu order. Cached for the duration of one request. */
export const getCategories = cache(async (): Promise<Category[]> => {
  const { data, error } = await db()
    .from("categories")
    .select("slug, name, color, sort_order, show_in_menu")
    .order("sort_order")
    .order("name");
  if (error) throw new Error(`Supabase: ${error.message}`);
  return (data as Row[]).map(toCategory);
});

export async function getMenuCategories(): Promise<Category[]> {
  return (await getCategories()).filter((c) => c.showInMenu);
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  return (await getCategories()).find((c) => c.slug === slug);
}

export async function categoryName(slug: string): Promise<string> {
  return (await getCategory(slug))?.name ?? slug;
}

// ---------- Admin writes (secret key) ----------

export type CategoryInput = Omit<Category, never>;

function toRow(c: CategoryInput) {
  return { slug: c.slug, name: c.name, color: c.color, sort_order: c.sortOrder, show_in_menu: c.showInMenu };
}

export async function createCategory(c: CategoryInput): Promise<void> {
  const { error } = await admin().from("categories").insert(toRow(c));
  if (error) throw new Error(error.code === "23505" ? `A category with slug "${c.slug}" already exists.` : error.message);
}

/** Updates a category; changing the slug also moves its articles (ON UPDATE CASCADE). */
export async function updateCategory(originalSlug: string, c: CategoryInput): Promise<void> {
  const { error, count } = await admin()
    .from("categories")
    .update(toRow(c), { count: "exact" })
    .eq("slug", originalSlug);
  if (error) throw new Error(error.code === "23505" ? `A category with slug "${c.slug}" already exists.` : error.message);
  if (!count) throw new Error("Category not found — it may have been deleted.");
}

/** Moves every article (published and draft) from one category to another. */
export async function moveArticles(fromSlug: string, toSlug: string): Promise<void> {
  const { error } = await admin().from("articles").update({ category: toSlug }).eq("category", fromSlug);
  if (error) throw new Error(error.message);
}

/** Deletes a category. Refused while articles still use it. */
export async function deleteCategory(slug: string): Promise<void> {
  const { error } = await admin().from("categories").delete().eq("slug", slug);
  if (error) {
    throw new Error(
      error.code === "23503"
        ? "This category still has articles. Move or delete them first."
        : error.message,
    );
  }
}
