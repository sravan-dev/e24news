import "server-only";
import { cache } from "react";
import type { Ad, AdPlacement } from "./types";
import { admin, db } from "./supabase";

// Ads live in Supabase (public.ads) and are managed from /admin/ads.

interface Row {
  id: string;
  title: string;
  image: string;
  link_url: string;
  placement: AdPlacement;
  active: boolean;
}

const toAd = (r: Row): Ad => ({
  id: r.id,
  title: r.title,
  image: r.image,
  linkUrl: r.link_url,
  placement: r.placement,
  active: r.active,
});

const COLUMNS = "id, title, image, link_url, placement, active";

/** Active ads, fetched once per request. Errors hide the ads instead of breaking the page. */
const getActiveAds = cache(async (): Promise<Ad[]> => {
  const { data, error } = await db().from("ads").select(COLUMNS).eq("active", true);
  if (error) {
    console.error("ads:", error.message);
    return [];
  }
  return (data as Row[]).map(toAd);
});

/** Ads already shown in this request, so one page never repeats an ad. */
const shownAds = cache(() => new Set<string>());

/** A random active ad for the placement that this page hasn't shown yet, or null. */
export async function pickAd(placement: AdPlacement): Promise<Ad | null> {
  const shown = shownAds();
  const pool = (await getActiveAds()).filter((a) => a.placement === placement && !shown.has(a.id));
  if (!pool.length) return null;
  const ad = pool[Math.floor(Math.random() * pool.length)];
  shown.add(ad.id);
  return ad;
}

/** How many active ads exist for the placement (used to decide how many slots to open). */
export async function countAds(placement: AdPlacement): Promise<number> {
  return (await getActiveAds()).filter((a) => a.placement === placement).length;
}

// ---------- Admin (secret key) ----------

export async function listAllAds(): Promise<Ad[]> {
  const { data, error } = await admin().from("ads").select(COLUMNS).order("created_at", { ascending: false });
  if (error) throw new Error(`Supabase: ${error.message}`);
  return (data as Row[]).map(toAd);
}

export async function getAd(id: string): Promise<Ad | undefined> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
  const { data, error } = await admin().from("ads").select(COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`Supabase: ${error.message}`);
  return data ? toAd(data as Row) : undefined;
}

export type AdInput = Omit<Ad, "id">;

function toRow(a: AdInput) {
  return {
    title: a.title,
    image: a.image,
    link_url: a.linkUrl,
    placement: a.placement,
    active: a.active,
    updated_at: new Date().toISOString(),
  };
}

export async function createAd(a: AdInput): Promise<void> {
  const { error } = await admin().from("ads").insert(toRow(a));
  if (error) throw new Error(error.message);
}

export async function updateAd(id: string, a: AdInput): Promise<void> {
  const { error, count } = await admin().from("ads").update(toRow(a), { count: "exact" }).eq("id", id);
  if (error) throw new Error(error.message);
  if (!count) throw new Error("Ad not found — it may have been deleted.");
}

export async function deleteAd(id: string): Promise<void> {
  const { error } = await admin().from("ads").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
