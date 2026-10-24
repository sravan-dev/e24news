import "server-only";
import crypto from "crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { admin } from "./supabase";
import { sessionVersion } from "./users";

const COOKIE = "e24_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// No fallbacks: without a strong SESSION_SECRET nobody can sign in. Accounts live in lib/users.ts.
function secret(): string | null {
  const s = process.env.SESSION_SECRET;
  return s && s.length >= 32 ? s : null;
}

function sign(value: string): string {
  const key = secret();
  if (!key) throw new Error("SESSION_SECRET must be set (at least 32 characters).");
  return crypto.createHmac("sha256", key).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export function authConfigured(): boolean {
  return !!secret();
}

// Brute-force limit, stored in Supabase so it holds across all server instances.
// Each attempt is recorded *before* the password is checked, so parallel requests count too.
// The IP comes from Vercel's x-real-ip (not spoofable), so an attacker can only lock out their own address.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10; // per IP per window

/** Records an attempt for this IP. Returns false when the IP is over the limit (don't check credentials). */
export async function beginLoginAttempt(ip: string): Promise<boolean> {
  const db = admin();
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  // Drop expired rows (bounded cleanup) and record this attempt.
  await db.from("login_attempts").delete().lt("attempted_at", since);
  const { error } = await db.from("login_attempts").insert({ ip });
  if (error) throw new Error(`login_attempts: ${error.message}`);
  const { count, error: countError } = await db
    .from("login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("attempted_at", since);
  if (countError) throw new Error(`login_attempts: ${countError.message}`);
  const n = count ?? MAX_ATTEMPTS + 1;
  if (n > MAX_ATTEMPTS) return false;
  // Small growing delay after the first few attempts.
  const delay = Math.min(Math.max(0, n - 3) * 500, 3000);
  if (delay) await new Promise((r) => setTimeout(r, delay));
  return true;
}

/** Successful login: forget this IP's attempts. */
export async function clearLoginAttempts(ip: string): Promise<void> {
  await admin().from("login_attempts").delete().eq("ip", ip);
}

/** `version` is the account's session version; changing the password bumps it and ends older sessions. */
export async function createSession(user: string, version: number): Promise<void> {
  const payload = `${user}.${version}.${Date.now() + MAX_AGE * 1000}`;
  const store = await cookies();
  store.set(COOKIE, `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** The signed-in username, or null. Checked against the database once per request. */
export const getSessionUser = cache(async (): Promise<string | null> => {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw || !secret()) return null;
  const [b64, sig] = raw.split(".");
  if (!b64 || !sig) return null;
  const payload = Buffer.from(b64, "base64url").toString();
  if (!safeEqual(sign(payload), sig)) return null;
  // payload = user.version.expires (the username itself may contain dots)
  const parts = payload.split(".");
  if (parts.length < 3) return null;
  const expires = Number(parts.pop());
  const version = Number(parts.pop());
  const user = parts.join(".");
  if (!expires || Date.now() > expires || !Number.isInteger(version)) return null;
  // Deleted accounts and sessions from before a password change are rejected.
  if ((await sessionVersion(user)) !== version) return null;
  return user;
});

export async function requireAdmin(): Promise<string> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  return user;
}
