import type { Category } from "./types";

export const CATEGORIES: Category[] = [
  { slug: "qatar", name: "Qatar", color: "#2e7d32" },
  { slug: "gulf", name: "Gulf", color: "#546e7a" },
  { slug: "kerala", name: "Kerala", color: "#e3202b" },
  { slug: "india", name: "India", color: "#ef6c00" },
  { slug: "grama-vartha", name: "Grama Vartha", color: "#222222" },
  { slug: "writers-corner", name: "Writers Corner", color: "#6a1b9a" },
  { slug: "tech", name: "Tech", color: "#1a73d0" },
  { slug: "movies", name: "Movies", color: "#222222" },
  { slug: "world", name: "World", color: "#e3202b" },
  { slug: "sports", name: "Sports", color: "#00897b" },
  { slug: "magazines", name: "Magazines", color: "#ad1457" },
];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function categoryName(slug: string): string {
  return getCategory(slug)?.name ?? slug;
}

export function categoryColor(slug: string): string {
  return getCategory(slug)?.color ?? "#222222";
}
