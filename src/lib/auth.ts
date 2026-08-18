import { db, ensureSchema } from "./db";
import crypto from "node:crypto";
import type { AstroCookies } from "astro";

const SESSION_COOKIE = "session_id";
const SESSION_DURATION_DAYS = 30;

export async function createSession(userId: number): Promise<string> {
  await ensureSchema();
  const sessionId = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await db.execute({
    sql: `INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)`,
    args: [sessionId, userId, expiresAt.toISOString()],
  });

  return sessionId;
}

export function setSessionCookie(cookies: AstroCookies, sessionId: string) {
  cookies.set(SESSION_COOKIE, sessionId, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  });
}

export function clearSessionCookie(cookies: AstroCookies) {
  cookies.delete(SESSION_COOKIE, { path: "/" });
}

export async function getCurrentUser(cookies: AstroCookies) {
  await ensureSchema();
  const sessionId = cookies.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const sessionResult = await db.execute({
    sql: `SELECT * FROM sessions WHERE id = ?`,
    args: [sessionId],
  });
  const session = sessionResult.rows[0] as any;
  if (!session) return null;

  if (new Date(session.expires_at as string) < new Date()) {
    await db.execute({ sql: `DELETE FROM sessions WHERE id = ?`, args: [sessionId] });
    return null;
  }

  const userResult = await db.execute({
    sql: `SELECT id, email, age_range, gender, education_level, occupation_status, country, city, settlement_type
          FROM users WHERE id = ?`,
    args: [session.user_id as number],
  });

  return userResult.rows[0] ?? null;
}

export async function hasCompletedSurvey(userId: number): Promise<boolean> {
  await ensureSchema();
  const result = await db.execute({
    sql: `SELECT COUNT(*) AS c FROM survey_responses WHERE user_id = ?`,
    args: [userId],
  });
  const count = Number((result.rows[0] as any).c);
  return count > 0;
}
