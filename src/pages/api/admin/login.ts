import type { APIRoute } from "astro";
import { verifyAdminPassword, createAdminSession, setAdminCookie } from "../../../lib/admin-auth";
import { ensureSchema } from "../../../lib/db";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  await ensureSchema();
  const { password } = await request.json();

  if (!password) {
    return new Response(JSON.stringify({ error: "Şifre gerekli." }), { status: 400 });
  }

  const valid = await verifyAdminPassword(password);
  if (!valid) {
    return new Response(JSON.stringify({ error: "Hatalı şifre." }), { status: 401 });
  }

  const sessionId = await createAdminSession();
  setAdminCookie(cookies, sessionId);

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
