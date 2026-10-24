import "server-only";
import crypto from "crypto";
import { promisify } from "util";
import { admin } from "./supabase";

// Admin accounts live in Supabase (public.admin_users) and are managed from /admin/settings.
// While the table is empty, ADMIN_USER / ADMIN_PASSWORD from the environment is the only account
// (version 0). The first password change or new user stores that account in the table, and from
// then on the environment credentials no longer work.

const scrypt = promisify(crypto.scrypt) as (pw: string, salt: Buffer, len: number, opts: crypto.ScryptOptions) => Promise<Buffer>;
const N = 16384;
const R = 8;
const P = 1;
const KEY_LEN = 64;

export const USERNAME_RE = /^[a-z0-9._@-]{3,64}$/;
export const MIN_PASSWORD = 10;

export interface AdminUser {
  id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export function normalizeUsername(u: string): string {
  return u.trim().toLowerCase();
}

export function passwordProblem(password: string, confirm: string): string | null {
  if (password.length < MIN_PASSWORD) return `Password must be at least ${MIN_PASSWORD} characters.`;
  if (password.length > 200) return "Password is too long.";
  if (password !== confirm) return "The two passwords don't match.";
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, KEY_LEN, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, n, r, p, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = await scrypt(password, Buffer.from(salt, "base64url"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return crypto.timingSafeEqual(actual, expected);
}

// Verified when the username doesn't exist, so response time doesn't reveal valid usernames.
let dummyHash: Promise<string> | null = null;

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

function envUser(): { username: string; password: string } | null {
  const u = process.env.ADMIN_USER;
  const p = process.env.ADMIN_PASSWORD;
  return u && p ? { username: normalizeUsername(u), password: p } : null;
}

async function hasStoredUsers(): Promise<boolean> {
  const { count, error } = await admin().from("admin_users").select("id", { count: "exact", head: true });
  if (error) throw new Error(`admin_users: ${error.message}`);
  return (count ?? 0) > 0;
}

/** Whether anyone can sign in at all (stored accounts or the environment account). */
export async function loginAvailable(): Promise<boolean> {
  return !!envUser() || (await hasStoredUsers());
}

/** Checks a username/password. Returns the account's session version, or null when wrong. */
export async function verifyLogin(user: string, password: string): Promise<{ username: string; version: number } | null> {
  const username = normalizeUsername(user);
  const { data, error } = await admin()
    .from("admin_users")
    .select("password_hash, session_version")
    .eq("username", username)
    .maybeSingle();
  if (error) throw new Error(`admin_users: ${error.message}`);
  if (data) {
    return (await verifyPassword(password, data.password_hash)) ? { username, version: data.session_version } : null;
  }
  const env = envUser();
  if (env && !(await hasStoredUsers())) {
    // Compare both fields so timing doesn't reveal which one was wrong.
    const userOk = safeEqual(username, env.username);
    const passOk = safeEqual(password, env.password);
    return userOk && passOk ? { username, version: 0 } : null;
  }
  await verifyPassword(password, await (dummyHash ??= hashPassword(crypto.randomUUID())));
  return null;
}

/** Current session version for a username, or null when the account no longer exists. */
export async function sessionVersion(username: string): Promise<number | null> {
  const { data, error } = await admin()
    .from("admin_users")
    .select("session_version")
    .eq("username", username)
    .maybeSingle();
  if (error) throw new Error(`admin_users: ${error.message}`);
  if (data) return data.session_version;
  const env = envUser();
  return env && env.username === username && !(await hasStoredUsers()) ? 0 : null;
}

/** True while only the environment account exists (nothing stored yet). */
export async function usingEnvAccount(): Promise<boolean> {
  return !(await hasStoredUsers());
}

/**
 * Stores the environment account in the table (keeping version 0 so its current session stays valid).
 * Called before the first stored change, so adding a user doesn't lock out the signed-in admin.
 */
async function storeEnvAccount(): Promise<void> {
  const env = envUser();
  if (!env || (await hasStoredUsers())) return;
  const { error } = await admin()
    .from("admin_users")
    .insert({ username: env.username, password_hash: await hashPassword(env.password), session_version: 0 });
  if (error && error.code !== "23505") throw new Error(error.message);
}

export async function listUsers(): Promise<AdminUser[]> {
  const { data, error } = await admin()
    .from("admin_users")
    .select("id, username, created_at, updated_at")
    .order("username");
  if (error) throw new Error(error.message);
  return data.map((r) => ({ id: r.id, username: r.username, createdAt: r.created_at, updatedAt: r.updated_at }));
}

export async function createUser(username: string, password: string): Promise<void> {
  await storeEnvAccount();
  const { error } = await admin()
    .from("admin_users")
    // Random starting version so a deleted-then-recreated username never matches an old session cookie.
    .insert({ username, password_hash: await hashPassword(password), session_version: crypto.randomInt(1, 2 ** 30) });
  if (error) throw new Error(error.code === "23505" ? `User "${username}" already exists.` : error.message);
}

/** Sets a new password and signs the account out everywhere. Returns the new session version. */
export async function setPassword(username: string, password: string): Promise<number> {
  await storeEnvAccount();
  const db = admin();
  const { data, error } = await db
    .from("admin_users")
    .select("session_version")
    .eq("username", username)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("User not found — it may have been deleted.");
  const version = data.session_version + 1;
  const { error: updateError } = await db
    .from("admin_users")
    .update({ password_hash: await hashPassword(password), session_version: version, updated_at: new Date().toISOString() })
    .eq("username", username);
  if (updateError) throw new Error(updateError.message);
  return version;
}

export async function deleteUser(username: string): Promise<void> {
  const { error, count } = await admin().from("admin_users").delete({ count: "exact" }).eq("username", username);
  if (error) throw new Error(error.message);
  if (!count) throw new Error("User not found — it may have been deleted.");
}
