import type { APIRoute } from "astro";
import { db, ensureSchema } from "../../../lib/db";
import { isAdminAuthenticated } from "../../../lib/admin-auth";

export const prerender = false;

// Tüm yorumları listele (admin)
export const GET: APIRoute = async ({ cookies }) => {
  await ensureSchema();
  if (!(await isAdminAuthenticated(cookies))) {
    return new Response(JSON.stringify({ error: "Yetkisiz." }), { status: 401 });
  }

  const result = await db.execute(
    `SELECT id, user_id, post_slug, comment_text, created_at FROM comments ORDER BY created_at DESC`
  );

  return new Response(JSON.stringify({ comments: result.rows }), { status: 200 });
};

// Yorum sil (admin)
export const POST: APIRoute = async ({ request, cookies }) => {
  await ensureSchema();
  if (!(await isAdminAuthenticated(cookies))) {
    return new Response(JSON.stringify({ error: "Yetkisiz." }), { status: 401 });
  }

  const { comment_id } = await request.json();
  if (!comment_id) {
    return new Response(JSON.stringify({ error: "comment_id zorunlu." }), { status: 400 });
  }

  await db.execute({
    sql: `DELETE FROM comments WHERE id = ?`,
    args: [comment_id],
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
