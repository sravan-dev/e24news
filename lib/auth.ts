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

// Basic brute-force brake: per-IP failure counter (per server instance) plus a fixed delay on failure.
const failures = new Map<string, { count: number; until: number }>();
const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;

export function loginBlocked(ip: string): boolean {
  const f = failures.get(ip);
  return !!f && f.count >= MAX_FAILURES && Date.now() < f.until;
}

export async function recordLoginFailure(ip: string): Promise<void> {
  const f = failures.get(ip);
  const fresh = !f || Date.now() >= f.until;
  failures.set(ip, { count: fresh ? 1 : f!.count + 1, until: Date.now() + LOCK_MS });
  await new Promise((r) => setTimeout(r, 800));
}

export function clearLoginFailures(ip: string): void {
  failures.delete(ip);
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
