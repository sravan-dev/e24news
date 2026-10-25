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

// Malayalam → Latin, so slugs stay plain ASCII. Non-ASCII URLs turn into
// %E0%B4%B5... when copied or shared (WhatsApp, Facebook).
const ML_VOWELS: Record<string, string> = {
  "അ": "a", "ആ": "aa", "ഇ": "i", "ഈ": "ee", "ഉ": "u", "ഊ": "oo", "ഋ": "ru",
  "എ": "e", "ഏ": "e", "ഐ": "ai", "ഒ": "o", "ഓ": "o", "ഔ": "au",
};
const ML_SIGNS: Record<string, string> = {
  "ാ": "aa", "ി": "i", "ീ": "ee", "ു": "u", "ൂ": "oo", "ൃ": "ru",
  "െ": "e", "േ": "e", "ൈ": "ai", "ൊ": "o", "ോ": "o", "ൌ": "au", "ൗ": "au",
};
const ML_CONSONANTS: Record<string, string> = {
  "ക": "k", "ഖ": "kh", "ഗ": "g", "ഘ": "gh", "ങ": "ng", "ച": "ch", "ഛ": "chh", "ജ": "j", "ഝ": "jh", "ഞ": "nj",
  "ട": "t", "ഠ": "th", "ഡ": "d", "ഢ": "dh", "ണ": "n", "ത": "th", "ഥ": "th", "ദ": "d", "ധ": "dh", "ന": "n",
  "പ": "p", "ഫ": "ph", "ബ": "b", "ഭ": "bh", "മ": "m", "യ": "y", "ര": "r", "റ": "r", "ല": "l", "ള": "l",
  "ഴ": "zh", "വ": "v", "ശ": "sh", "ഷ": "sh", "സ": "s", "ഹ": "h",
};
const ML_OTHER: Record<string, string> = {
  "ൺ": "n", "ൻ": "n", "ർ": "r", "ൽ": "l", "ൾ": "l", "ൿ": "k", "ം": "m", "ഃ": "h",
  "൦": "0", "൧": "1", "൨": "2", "൩": "3", "൪": "4", "൫": "5", "൬": "6", "൭": "7", "൮": "8", "൯": "9",
};
const VIRAMA = "്";

function transliterateMalayalam(text: string): string {
  let out = "";
  let inherent = false; // the last thing written is a consonant's implicit "a"
  for (const ch of text.normalize("NFC").replace(/ന്റ/g, "nt").replace(/റ്റ/g, "tt")) {
    if (ML_CONSONANTS[ch]) {
      out += ML_CONSONANTS[ch] + "a";
      inherent = true;
      continue;
    }
    if (ML_SIGNS[ch] || ch === VIRAMA) {
      if (inherent) out = out.slice(0, -1);
      out += ML_SIGNS[ch] ?? "";
    } else if (ch !== "‌" && ch !== "‍") {
      out += ML_VOWELS[ch] ?? ML_OTHER[ch] ?? ch;
    }
    inherent = false;
  }
  return out;
}

export function slugify(text: string): string {
  return transliterateMalayalam(text.toLowerCase())
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "") // é → e
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

export function paragraphs(content: string): string[] {
  return content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
