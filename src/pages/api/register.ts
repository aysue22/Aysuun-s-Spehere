import type { APIRoute } from "astro";
import bcrypt from "bcryptjs";
import { db, ensureSchema } from "../../lib/db";
import { createSession, setSessionCookie } from "../../lib/auth";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  await ensureSchema();

  const body = await request.json();
  const {
    email,
    password,
    age_range,
    gender,
    education_level,
    occupation_status,
    country,
    city,
    settlement_type,
    consent_research,
  } = body;

  if (!email || !password) {
    return new Response(
      JSON.stringify({ error: "E-posta ve şifre zorunludur." }),
      { status: 400 }
    );
  }

  if (!consent_research) {
    return new Response(
      JSON.stringify({
        error: "Verilerinizin araştırma amaçlı kullanımı için onay vermelisiniz.",
      }),
      { status: 400 }
    );
  }

  const existingResult = await db.execute({
    sql: `SELECT id FROM users WHERE email = ?`,
    args: [email],
  });
  if (existingResult.rows.length > 0) {
    return new Response(
      JSON.stringify({ error: "Bu e-posta zaten kayıtlı." }),
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await db.execute({
    sql: `INSERT INTO users
        (email, password_hash, age_range, gender, education_level, occupation_status, country, city, settlement_type, consent_research, consent_given_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    args: [
      email,
      passwordHash,
      age_range ?? null,
      gender ?? null,
      education_level ?? null,
      occupation_status ?? null,
      country ?? null,
      city ?? null,
      settlement_type ?? null,
      1,
    ],
  });

  const userId = Number(result.lastInsertRowid);
  const sessionId = await createSession(userId);
  setSessionCookie(cookies, sessionId);

  return new Response(JSON.stringify({ success: true }), { status: 201 });
};
