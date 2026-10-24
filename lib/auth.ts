import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "e24_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// No fallbacks: without a strong SESSION_SECRET and explicit admin credentials, nobody can sign in.
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
  return !!(process.env.ADMIN_USER && process.env.ADMIN_PASSWORD && secret());
}

export function checkCredentials(user: string, password: string): boolean {
  if (!authConfigured()) return false;
  // Compare both fields so timing doesn't reveal which one was wrong.
  const userOk = safeEqual(user, process.env.ADMIN_USER!);
  const passOk = safeEqual(password, process.env.ADMIN_PASSWORD!);
  return userOk && passOk;
}

// Brute-force brake: failed logins from an IP add a growing delay (per server instance).
// No hard lockout, so an attacker can't lock the real admin out; correct credentials always work.
const failures = new Map<string, { count: number; last: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_DELAY_MS = 8000;

function failureCount(ip: string): number {
  const f = failures.get(ip);
  if (!f || Date.now() - f.last > WINDOW_MS) return 0;
  return f.count;
}

/** Waits longer the more recent failures this IP has (0s for the first 2, then 1s, 2s, ... up to 8s). */
export async function throttleLogin(ip: string | null): Promise<void> {
  if (!ip) return;
  const delay = Math.min(Math.max(0, failureCount(ip) - 2) * 1000, MAX_DELAY_MS);
  if (delay) await new Promise((r) => setTimeout(r, delay));
}

export function recordLoginFailure(ip: string | null): void {
  if (!ip) return;
  failures.set(ip, { count: failureCount(ip) + 1, last: Date.now() });
  if (failures.size > 10_000) failures.clear(); // keep memory bounded
}

export function clearLoginFailures(ip: string | null): void {
  if (ip) failures.delete(ip);
}

export async function createSession(user: string): Promise<void> {
  const payload = `${user}.${Date.now() + MAX_AGE * 1000}`;
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

export async function getSessionUser(): Promise<string | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw || !secret()) return null;
  const [b64, sig] = raw.split(".");
  if (!b64 || !sig) return null;
  const payload = Buffer.from(b64, "base64url").toString();
  if (!safeEqual(sign(payload), sig)) return null;
  const dot = payload.lastIndexOf(".");
  const expires = Number(payload.slice(dot + 1));
  if (!expires || Date.now() > expires) return null;
  return payload.slice(0, dot);
}

export async function requireAdmin(): Promise<string> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  return user;
}
