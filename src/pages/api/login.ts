import type { APIRoute } from "astro";
import bcrypt from "bcryptjs";
import { db, ensureSchema } from "../../lib/db";
import { createSession, setSessionCookie } from "../../lib/auth";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  await ensureSchema();
  const { email, password } = await request.json();

  if (!email || !password) {
    return new Response(
      JSON.stringify({ error: "E-posta ve şifre zorunludur." }),
      { status: 400 }
    );
  }

  const result = await db.execute({
    sql: `SELECT id, password_hash FROM users WHERE email = ?`,
    args: [email],
  });
  const user = result.rows[0] as any;

  if (!user) {
    return new Response(
      JSON.stringify({ error: "E-posta veya şifre hatalı." }),
      { status: 401 }
    );
  }

  const valid = await bcrypt.compare(password, user.password_hash as string);
  if (!valid) {
    return new Response(
      JSON.stringify({ error: "E-posta veya şifre hatalı." }),
      { status: 401 }
    );
  }

  const sessionId = await createSession(user.id as number);
  setSessionCookie(cookies, sessionId);

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
