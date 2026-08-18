import type { APIRoute } from "astro";
import { db, ensureSchema } from "../../../lib/db";
import { isAdminAuthenticated } from "../../../lib/admin-auth";

export const prerender = false;

// Bekleyen/tüm gönderileri listele
export const GET: APIRoute = async ({ cookies, url }) => {
  await ensureSchema();
  if (!(await isAdminAuthenticated(cookies))) {
    return new Response(JSON.stringify({ error: "Yetkisiz." }), { status: 401 });
  }

  const status = url.searchParams.get("status") || "pending";
  const result = await db.execute({
    sql: `SELECT id, user_id, project_name, slug, tag, short_desc, link, content, status, submitted_at
          FROM collective_submissions WHERE status = ? ORDER BY submitted_at DESC`,
    args: [status],
  });

  return new Response(JSON.stringify({ submissions: result.rows }), { status: 200 });
};

// Onayla / Reddet
export const POST: APIRoute = async ({ request, cookies }) => {
  await ensureSchema();
  if (!(await isAdminAuthenticated(cookies))) {
    return new Response(JSON.stringify({ error: "Yetkisiz." }), { status: 401 });
  }

  const { submission_id, action } = await request.json();
  if (!submission_id || !["approved", "rejected"].includes(action)) {
    return new Response(JSON.stringify({ error: "Geçersiz istek." }), { status: 400 });
  }

  await db.execute({
    sql: `UPDATE collective_submissions SET status = ?, reviewed_at = datetime('now') WHERE id = ?`,
    args: [action, submission_id],
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
