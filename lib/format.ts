// Dates are shown in India time regardless of where the server runs (Vercel uses UTC).
const TIME_ZONE = "Asia/Kolkata";

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function longDate(d = new Date()): string {
  return d.toLocaleDateString("en-US", {
    timeZone: TIME_ZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "...";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    // Drop accents on Latin letters (é → e) but keep the vowel signs that
    // Malayalam and other Indic scripts need to stay readable.
    .replace(/(\p{Script=Latin})\p{M}+/gu, "$1")
    .replace(/[‌‍]/g, "")
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .normalize("NFC")
    .slice(0, 80);
}

export function paragraphs(content: string): string[] {
  return content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
