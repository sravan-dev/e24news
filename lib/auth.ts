import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "e24_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret(): string {
  return process.env.SESSION_SECRET || "dev-only-insecure-secret";
}

function sign(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export function checkCredentials(user: string, password: string): boolean {
  const u = process.env.ADMIN_USER || "admin";
  const p = process.env.ADMIN_PASSWORD || "e24admin";
  return safeEqual(user, u) && safeEqual(password, p);
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
  if (!raw) return null;
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
