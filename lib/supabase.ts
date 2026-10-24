import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

const options = { auth: { persistSession: false, autoRefreshToken: false } };

let publicClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

export const IMAGE_BUCKET = "news-images";

export function hasSecretKey(): boolean {
  return !!secretKey;
}

/** Server-side client for reads. Uses the secret key when set, otherwise the publishable key (RLS: published only). */
export function db(): SupabaseClient {
  if (secretKey) return admin();
  if (!url || !publishableKey) throw new Error("Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in .env.local");
  return (publicClient ??= createClient(url, publishableKey, options));
}

/** Server-side client with full access. Required for anything the admin panel writes. */
export function admin(): SupabaseClient {
  if (!url || !secretKey) {
    throw new Error("SUPABASE_SECRET_KEY is missing in .env.local — copy it from Supabase → Project Settings → API Keys.");
  }
  return (adminClient ??= createClient(url, secretKey, options));
}
