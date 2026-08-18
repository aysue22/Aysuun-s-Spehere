import { db, ensureSchema } from "./db";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { AstroCookies } from "astro";

const ADMIN_COOKIE = "admin_session";
const SESSION_HOURS = 12;

// Şifre hash'i .env / Vercel Environment Variables içinden okunur —
// kodda ASLA düz metin şifre olmaz.
// Hash üretmek için: node scripts/hash-admin-password.mjs "yeni-sifreniz"
function getAdminPasswordHash(): string {
  const hash = import.meta.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    throw new Error(
      "ADMIN_PASSWORD_HASH tanımlı değil. .env dosyasına (yerelde) ve Vercel " +
        "Environment Variables'a (production'da) ekleyin."
    );
  }
  return hash;
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  return bcrypt.compare(password, getAdminPasswordHash());
}

export async function createAdminSession(): Promise<string> {
  await ensureSchema();
  const sessionId = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + SESSION_HOURS);

  await db.execute({
    sql: `INSERT INTO admin_sessions (id, expires_at) VALUES (?, ?)`,
    args: [sessionId, expiresAt.toISOString()],
  });
  return sessionId;
}

export function setAdminCookie(cookies: AstroCookies, sessionId: string) {
  cookies.set(ADMIN_COOKIE, sessionId, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: SESSION_HOURS * 60 * 60,
  });
}

export function clearAdminCookie(cookies: AstroCookies) {
  cookies.delete(ADMIN_COOKIE, { path: "/" });
}

export async function isAdminAuthenticated(cookies: AstroCookies): Promise<boolean> {
  await ensureSchema();
  const sessionId = cookies.get(ADMIN_COOKIE)?.value;
  if (!sessionId) return false;

  const result = await db.execute({
    sql: `SELECT expires_at FROM admin_sessions WHERE id = ?`,
    args: [sessionId],
  });
  const session = result.rows[0] as any;
  if (!session) return false;

  if (new Date(session.expires_at as string) < new Date()) {
    await db.execute({ sql: `DELETE FROM admin_sessions WHERE id = ?`, args: [sessionId] });
    return false;
  }
  return true;
}
